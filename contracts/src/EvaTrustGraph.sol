// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IEvaTrustGraph} from "./interfaces/IEvaTrustGraph.sol";
import {IERC8004Identity} from "./interfaces/IERC8004Identity.sol";
import {IERC8004Reputation} from "./interfaces/IERC8004Reputation.sol";
import {IERC8004Validation} from "./interfaces/IERC8004Validation.sol";
import {TrustMath} from "./libraries/TrustMath.sol";
import {YieldMath} from "./libraries/YieldMath.sol";

/// @title EvaTrustGraph
/// @notice Trust-graph social-curation contract for curators and backers using existing $EVA + ERC-8004 registries.
contract EvaTrustGraph is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    IEvaTrustGraph
{
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    uint256 internal constant SCALE = 1e18;
    uint8 internal constant INITIAL_TRUST_SCORE = 50;

    IERC20 public evaToken;
    IERC8004Identity public identityRegistry;
    IERC8004Reputation public reputationRegistry;
    IERC8004Validation public validationRegistry;

    address public treasury;

    uint256 public yieldReserve;
    uint256 public nextArticleId;

    uint8 public maxScoreDelta;
    uint8 public decayPerEpoch;
    uint64 public decayEpochSeconds;
    uint256 public minSelfStake;
    uint256 public minBacking;
    uint256 public submissionFee;
    uint256 public premiumSubmissionFee;
    uint256 public minYieldMultiplierBps;
    uint256 public maxYieldMultiplierBps;

    mapping(address curator => Curator data) private _curators;
    mapping(uint256 curatorAgentId => address curator) private _curatorByAgentId;
    mapping(address curator => mapping(address backer => DelegationPosition data)) private _delegations;
    mapping(uint256 articleId => ArticleSubmission data) private _articles;

    /// @notice Initializes the protocol with token, registries, and control roles.
    /// @param evaToken_ Existing $EVA token address.
    /// @param identityRegistry_ ERC-8004 identity registry address.
    /// @param reputationRegistry_ ERC-8004 reputation registry address.
    /// @param validationRegistry_ ERC-8004 validation registry address.
    /// @param treasury_ Treasury address for admin-level fund routing.
    /// @param admin_ Default admin role receiver.
    /// @param oracle_ Oracle role receiver used for article verification updates.
    function initialize(
        address evaToken_,
        address identityRegistry_,
        address reputationRegistry_,
        address validationRegistry_,
        address treasury_,
        address admin_,
        address oracle_
    ) external initializer {
        if (
            evaToken_ == address(0) || identityRegistry_ == address(0) || reputationRegistry_ == address(0)
                || validationRegistry_ == address(0) || treasury_ == address(0) || admin_ == address(0)
                || oracle_ == address(0)
        ) {
            revert InvalidAddress();
        }

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        evaToken = IERC20(evaToken_);
        identityRegistry = IERC8004Identity(identityRegistry_);
        reputationRegistry = IERC8004Reputation(reputationRegistry_);
        validationRegistry = IERC8004Validation(validationRegistry_);

        treasury = treasury_;

        maxScoreDelta = 5;
        decayPerEpoch = 1;
        decayEpochSeconds = 7 days;
        minSelfStake = 10_000e18;
        minBacking = 100e18;
        submissionFee = 1_000e18;
        premiumSubmissionFee = 100_000e18;
        minYieldMultiplierBps = 8_000;
        maxYieldMultiplierBps = 15_000;

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ORACLE_ROLE, oracle_);
    }

    /// @notice Registers a curator with mandatory self-stake and linked ERC-8004 identity ownership.
    /// @param curatorAgentId ERC-8004 identity agent id that must be owned by the caller.
    /// @param amount Self-stake amount in $EVA.
    function registerCurator(uint256 curatorAgentId, uint256 amount) external nonReentrant {
        uint256 requiredStake = _requiredSelfStake(INITIAL_TRUST_SCORE);
        if (amount < requiredStake) {
            revert StakeBelowMinimum();
        }

        Curator storage curator = _curators[msg.sender];
        if (curator.registered) {
            revert AlreadyRegistered();
        }
        if (_curatorByAgentId[curatorAgentId] != address(0)) {
            revert AgentIdAlreadyRegistered();
        }

        if (identityRegistry.ownerOf(curatorAgentId) != msg.sender) {
            revert IdentityOwnershipMismatch();
        }

        evaToken.safeTransferFrom(msg.sender, address(this), amount);

        curator.registered = true;
        curator.curatorAgentId = curatorAgentId;
        curator.selfStake = amount;
        curator.trustScore = INITIAL_TRUST_SCORE;
        curator.registeredAt = uint64(block.timestamp);
        curator.lastTrustUpdate = uint64(block.timestamp);
        curator.lastArticleAt = uint64(block.timestamp);
        _curatorByAgentId[curatorAgentId] = msg.sender;

        emit CuratorRegistered(msg.sender, curatorAgentId, amount, INITIAL_TRUST_SCORE);
    }

    /// @notice Increases curator self-stake.
    /// @param amount Additional amount in $EVA to lock as self-stake.
    function increaseSelfStake(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        Curator storage curator = _requireCurator(msg.sender);
        _accrueCuratorYield(curator);

        evaToken.safeTransferFrom(msg.sender, address(this), amount);

        curator.selfStake += amount;
        curator.selfRewardDebt = Math.mulDiv(curator.selfStake, curator.accYieldPerStakeX18, SCALE);

        emit SelfStakeAdded(msg.sender, amount);
    }

    /// @notice Withdraws a portion of curator self-stake while preserving minimum required registration stake.
    /// @param amount Amount of $EVA to withdraw.
    function withdrawSelfStake(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        Curator storage curator = _requireCurator(msg.sender);
        _accrueCuratorYield(curator);

        if (curator.selfStake < amount) {
            revert InsufficientStake();
        }

        uint256 remaining = curator.selfStake - amount;
        if (remaining < _requiredSelfStake(curator.trustScore)) {
            revert StakeBelowMinimum();
        }

        curator.selfStake = remaining;
        curator.selfRewardDebt = Math.mulDiv(curator.selfStake, curator.accYieldPerStakeX18, SCALE);

        evaToken.safeTransfer(msg.sender, amount);
        emit SelfStakeWithdrawn(msg.sender, amount);
    }

    /// @notice Deactivates a curator profile and withdraws all self-stake plus pending self-yield.
    /// @dev Curator must have zero delegated backing before deactivation.
    function deactivateCurator() external nonReentrant {
        Curator storage curator = _requireCurator(msg.sender);
        if (curator.delegatedStake != 0) {
            revert ActiveBackersExist();
        }

        _accrueCuratorYield(curator);

        uint256 selfStakeReturned = curator.selfStake;
        uint256 yieldClaimed = curator.pendingSelfYield;
        uint256 payout = selfStakeReturned + yieldClaimed;
        uint256 curatorAgentId = curator.curatorAgentId;

        emit CuratorDeactivating(msg.sender, curatorAgentId);

        delete _curatorByAgentId[curatorAgentId];
        delete _curators[msg.sender];

        evaToken.safeTransfer(msg.sender, payout);
        emit CuratorWithdrawn(msg.sender, selfStakeReturned, yieldClaimed);
    }

    /// @notice Delegates stake from a backer to a registered curator.
    /// @param curatorAddr Curator address to back.
    /// @param amount Amount of $EVA to delegate.
    function backCurator(address curatorAddr, uint256 amount) external nonReentrant {
        if (curatorAddr == address(0)) {
            revert InvalidAddress();
        }
        if (amount < minBacking) {
            revert StakeBelowMinimum();
        }

        Curator storage curator = _requireCurator(curatorAddr);
        _accrueDelegatorYield(curatorAddr, msg.sender, curator);

        evaToken.safeTransferFrom(msg.sender, address(this), amount);

        DelegationPosition storage position = _delegations[curatorAddr][msg.sender];
        position.amount += amount;
        curator.delegatedStake += amount;

        position.rewardDebt = Math.mulDiv(position.amount, curator.accYieldPerStakeX18, SCALE);

        emit StakeDelegated(curatorAddr, msg.sender, amount);
    }

    /// @notice Removes delegated stake from a curator and returns principal to the backer.
    /// @param curatorAddr Curator address backed by the caller.
    /// @param amount Amount of $EVA to undelegate.
    function unbackCurator(address curatorAddr, uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        Curator storage curator = _requireCurator(curatorAddr);
        _accrueDelegatorYield(curatorAddr, msg.sender, curator);

        DelegationPosition storage position = _delegations[curatorAddr][msg.sender];
        if (position.amount < amount) {
            revert InsufficientStake();
        }

        position.amount -= amount;
        curator.delegatedStake -= amount;

        if (position.amount == 0) {
            position.rewardDebt = 0;
        } else {
            position.rewardDebt = Math.mulDiv(position.amount, curator.accYieldPerStakeX18, SCALE);
        }

        evaToken.safeTransfer(msg.sender, amount);
        emit StakeUndelegated(curatorAddr, msg.sender, amount);
    }

    /// @notice Submits a standard article for oracle verification and charges the standard submission fee.
    /// @param articleHash Canonical hash of the article payload.
    /// @param sourceURI Off-chain URI for full source metadata.
    /// @return articleId New article submission id.
    function submitArticle(bytes32 articleHash, string calldata sourceURI)
        external
        nonReentrant
        returns (uint256 articleId)
    {
        _collectSubmissionFee(msg.sender, submissionFee);
        articleId = _submitArticle(msg.sender, articleHash, sourceURI, false);
    }

    /// @notice Submits an article for deep analysis and charges the premium submission fee.
    /// @param articleHash Canonical hash of the article payload.
    /// @param sourceURI Off-chain URI for full source metadata.
    /// @return articleId New article submission id.
    function submitArticlePremium(bytes32 articleHash, string calldata sourceURI)
        external
        nonReentrant
        returns (uint256 articleId)
    {
        _collectSubmissionFee(msg.sender, premiumSubmissionFee);
        articleId = _submitArticle(msg.sender, articleHash, sourceURI, true);
    }

    /// @notice Sends a direct tip in $EVA to a registered curator identified by ERC-8004 agent id.
    /// @param curatorAgentId Curator agent id.
    /// @param amount Tip amount in $EVA.
    function tipCurator(uint256 curatorAgentId, uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        address curatorAddr = _curatorByAgentId[curatorAgentId];
        if (curatorAddr == address(0)) {
            revert NotRegistered();
        }

        evaToken.safeTransferFrom(msg.sender, curatorAddr, amount);
        emit CuratorTipped(curatorAgentId, msg.sender, amount);
    }

    /// @notice Applies oracle verification for an article, updates trust score, and allocates trust-weighted yield.
    /// @param articleId Article submission id to verify.
    /// @param verificationScore Oracle verification score in [0, 100].
    /// @param baseYield Base yield amount before trust multiplier.
    /// @param evidenceURI URI for evidence bundle used by the oracle.
    /// @param responseHash Integrity hash of the response payload.
    /// @param tag Semantic tag written to ERC-8004 validation/reputation registries.
    function processVerification(
        uint256 articleId,
        uint8 verificationScore,
        uint256 baseYield,
        string calldata evidenceURI,
        bytes32 responseHash,
        string calldata tag
    ) external onlyRole(ORACLE_ROLE) {
        if (verificationScore > 100) {
            revert InvalidScore();
        }

        ArticleSubmission storage article = _articles[articleId];
        address curatorAddr = article.curator;
        if (curatorAddr == address(0)) {
            revert ArticleNotFound();
        }
        if (article.status == ArticleStatus.Verified) {
            revert ArticleAlreadyVerified();
        }

        Curator storage curator = _requireCurator(curatorAddr);

        _materializeDecay(curatorAddr, curator);

        uint8 priorScore = curator.trustScore;
        int256 delta = TrustMath.boundedDelta(priorScore, verificationScore, maxScoreDelta);
        uint8 nextScore = TrustMath.applyDelta(priorScore, delta);

        if (nextScore != priorScore) {
            curator.trustScore = nextScore;
            emit TrustScoreUpdated(curatorAddr, priorScore, nextScore, delta);
        }

        curator.lastTrustUpdate = uint64(block.timestamp);
        curator.lastArticleAt = uint64(block.timestamp);

        article.status = ArticleStatus.Verified;
        article.verifiedAt = uint64(block.timestamp);
        article.verificationScore = verificationScore;
        article.evidenceURI = evidenceURI;
        article.responseHash = responseHash;
        article.validationTag = tag;

        uint256 allocatedYield;
        uint256 totalStake = curator.selfStake + curator.delegatedStake;
        if (baseYield > 0 && totalStake > 0 && yieldReserve > 0) {
            uint256 adjustedYield =
                YieldMath.adjustedYield(baseYield, nextScore, minYieldMultiplierBps, maxYieldMultiplierBps);

            if (adjustedYield > yieldReserve) {
                adjustedYield = yieldReserve;
            }

            if (adjustedYield > 0) {
                curator.accYieldPerStakeX18 += Math.mulDiv(adjustedYield, SCALE, totalStake);
                yieldReserve -= adjustedYield;
                allocatedYield = adjustedYield;
                emit YieldAllocated(curatorAddr, articleId, adjustedYield, nextScore);
            }
        }

        emit ArticleVerified(articleId, curatorAddr, verificationScore, nextScore, allocatedYield, evidenceURI);

        // Best effort registry writes to preserve liveness if registry interfaces evolve.
        try validationRegistry.validationResponse(
            article.requestHash, verificationScore, evidenceURI, responseHash, tag
        ) {}
            catch {}
        try reputationRegistry.addReputation(curatorAddr, nextScore, tag) {} catch {}
    }

    /// @notice Applies inactivity decay to a curator trust score.
    /// @param curatorAddr Curator address.
    function applyDecay(address curatorAddr) external {
        Curator storage curator = _requireCurator(curatorAddr);
        bool updated = _materializeDecay(curatorAddr, curator);
        if (!updated) {
            revert DecayNotDue();
        }
    }

    /// @notice Claims accrued yield for a backer delegation on a specific curator.
    /// @param curatorAddr Curator address.
    /// @return claimed Amount of $EVA claimed.
    function claimDelegatorYield(address curatorAddr) external nonReentrant returns (uint256 claimed) {
        Curator storage curator = _curators[curatorAddr];
        DelegationPosition storage position = _delegations[curatorAddr][msg.sender];

        // Allow claims even after curator deactivation so previously accrued rewards are never stranded.
        if (curator.registered) {
            _accrueDelegatorYield(curatorAddr, msg.sender, curator);
        } else if (position.pendingYield == 0) {
            revert NotRegistered();
        }

        claimed = position.pendingYield;
        if (claimed == 0) {
            revert NoYield();
        }

        position.pendingYield = 0;
        evaToken.safeTransfer(msg.sender, claimed);

        emit YieldClaimed(curatorAddr, msg.sender, claimed);
    }

    /// @notice Claims accrued curator yield from self-stake participation.
    /// @return claimed Amount of $EVA claimed.
    function claimCuratorYield() external nonReentrant returns (uint256 claimed) {
        Curator storage curator = _requireCurator(msg.sender);
        _accrueCuratorYield(curator);

        claimed = curator.pendingSelfYield;
        if (claimed == 0) {
            revert NoYield();
        }

        curator.pendingSelfYield = 0;
        evaToken.safeTransfer(msg.sender, claimed);

        emit YieldClaimed(msg.sender, msg.sender, claimed);
    }

    /// @notice Funds the yield reserve used for trust-weighted distributions.
    /// @param amount Amount of $EVA transferred into reserve.
    function fundYield(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        evaToken.safeTransferFrom(msg.sender, address(this), amount);
        yieldReserve += amount;

        emit YieldFunded(msg.sender, amount, yieldReserve);
    }

    /// @notice Updates core trust and yield parameters.
    /// @dev Restricted to default admin role.
    function updateParameters(
        uint8 maxScoreDelta_,
        uint8 decayPerEpoch_,
        uint64 decayEpochSeconds_,
        uint256 minSelfStake_,
        uint256 minBacking_,
        uint256 minYieldMultiplierBps_,
        uint256 maxYieldMultiplierBps_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (maxScoreDelta_ > 100) {
            revert InvalidScore();
        }
        if (decayEpochSeconds_ == 0) {
            revert InvalidAmount();
        }
        if (minSelfStake_ == 0 || minBacking_ == 0) {
            revert InvalidAmount();
        }
        if (minYieldMultiplierBps_ == 0 || maxYieldMultiplierBps_ < minYieldMultiplierBps_) {
            revert InvalidMultiplierRange();
        }

        maxScoreDelta = maxScoreDelta_;
        decayPerEpoch = decayPerEpoch_;
        decayEpochSeconds = decayEpochSeconds_;
        minSelfStake = minSelfStake_;
        minBacking = minBacking_;
        minYieldMultiplierBps = minYieldMultiplierBps_;
        maxYieldMultiplierBps = maxYieldMultiplierBps_;

        emit ParametersUpdated(
            maxScoreDelta_,
            decayPerEpoch_,
            decayEpochSeconds_,
            minSelfStake_,
            minBacking_,
            minYieldMultiplierBps_,
            maxYieldMultiplierBps_
        );
    }

    /// @notice Updates treasury address.
    /// @dev Restricted to default admin role.
    /// @param treasury_ New treasury address.
    function setTreasury(address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (treasury_ == address(0)) {
            revert InvalidAddress();
        }
        address oldTreasury = treasury;
        treasury = treasury_;
        emit TreasuryUpdated(oldTreasury, treasury_);
    }

    /// @notice Returns curator data.
    function getCurator(address curatorAddr) external view returns (Curator memory) {
        return _curators[curatorAddr];
    }

    /// @notice Returns delegation position for a backer and curator pair.
    function getDelegation(address curatorAddr, address backer) external view returns (DelegationPosition memory) {
        return _delegations[curatorAddr][backer];
    }

    /// @notice Returns current pending delegator yield including unmaterialized accrual.
    function pendingDelegatorYield(address curatorAddr, address backer) external view returns (uint256) {
        Curator storage curator = _curators[curatorAddr];
        DelegationPosition storage position = _delegations[curatorAddr][backer];

        uint256 accrued = _accruedFromDebt(position.amount, curator.accYieldPerStakeX18, position.rewardDebt);
        return position.pendingYield + accrued;
    }

    /// @notice Returns current pending curator yield including unmaterialized accrual.
    function pendingCuratorYield(address curatorAddr) external view returns (uint256) {
        Curator storage curator = _curators[curatorAddr];
        uint256 accrued = _accruedFromDebt(curator.selfStake, curator.accYieldPerStakeX18, curator.selfRewardDebt);
        return curator.pendingSelfYield + accrued;
    }

    /// @notice Returns article submission and verification data.
    function getArticle(uint256 articleId) external view returns (ArticleSubmission memory) {
        return _articles[articleId];
    }

    /// @notice Returns minimum required self-stake for a trust score tier.
    /// @param trustScore Trust score in [0, 100].
    /// @return requiredStake Minimum stake required for that score.
    function getMinStakeForScore(uint8 trustScore) external view returns (uint256 requiredStake) {
        if (trustScore > 100) {
            revert InvalidScore();
        }
        requiredStake = _requiredSelfStake(trustScore);
    }

    /// @notice Previews trust score and adjusted yield for a hypothetical verification update.
    /// @param curatorAddr Curator address.
    /// @param verificationScore Hypothetical score in [0, 100].
    /// @param baseYield Hypothetical base yield before multiplier.
    /// @return nextScore Computed next trust score.
    /// @return adjustedYield Yield amount after multiplier and reserve cap.
    function previewVerification(address curatorAddr, uint8 verificationScore, uint256 baseYield)
        external
        view
        returns (uint8 nextScore, uint256 adjustedYield)
    {
        if (verificationScore > 100) {
            revert InvalidScore();
        }

        Curator storage curator = _requireCuratorView(curatorAddr);

        uint8 decayed = TrustMath.decayedScore(
            curator.trustScore, curator.lastTrustUpdate, uint64(block.timestamp), decayEpochSeconds, decayPerEpoch
        );

        int256 delta = TrustMath.boundedDelta(decayed, verificationScore, maxScoreDelta);
        nextScore = TrustMath.applyDelta(decayed, delta);

        adjustedYield = YieldMath.adjustedYield(baseYield, nextScore, minYieldMultiplierBps, maxYieldMultiplierBps);
        if (adjustedYield > yieldReserve) {
            adjustedYield = yieldReserve;
        }
    }

    function _submitArticle(address curatorAddr, bytes32 articleHash, string memory sourceURI, bool premium)
        internal
        returns (uint256 articleId)
    {
        if (articleHash == bytes32(0)) {
            revert InvalidHash();
        }

        Curator storage curator = _requireCurator(curatorAddr);
        if (curator.selfStake < _requiredSelfStake(curator.trustScore)) {
            revert StakeBelowMinimum();
        }
        articleId = ++nextArticleId;

        bytes32 requestHash = keccak256(
            abi.encodePacked(block.chainid, curatorAddr, articleHash, keccak256(bytes(sourceURI)), articleId, premium)
        );

        ArticleSubmission storage article = _articles[articleId];
        article.curator = curatorAddr;
        article.articleHash = articleHash;
        article.sourceURI = sourceURI;
        article.requestHash = requestHash;
        article.submittedAt = uint64(block.timestamp);
        article.premium = premium;
        article.status = ArticleStatus.Pending;

        curator.articleCount += 1;
        curator.lastArticleAt = uint64(block.timestamp);

        emit ArticleSubmitted(articleId, curatorAddr, articleHash, requestHash);
    }

    function _collectSubmissionFee(address submitter, uint256 fee) internal {
        if (fee == 0) {
            revert InvalidAmount();
        }
        evaToken.safeTransferFrom(submitter, address(this), fee);
        yieldReserve += fee;
        emit YieldFunded(submitter, fee, yieldReserve);
    }

    function _requiredSelfStake(uint8 trustScore) internal view returns (uint256) {
        uint256 scoreTierStake = TrustMath.getMinStake(trustScore);
        return scoreTierStake > minSelfStake ? scoreTierStake : minSelfStake;
    }

    /// @inheritdoc UUPSUpgradeable
    function _authorizeUpgrade(address newImplementation) internal view override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newImplementation == address(0)) {
            revert InvalidAddress();
        }
    }

    function _requireCurator(address curatorAddr) internal view returns (Curator storage curator) {
        curator = _curators[curatorAddr];
        if (!curator.registered) {
            revert NotRegistered();
        }
    }

    function _requireCuratorView(address curatorAddr) internal view returns (Curator storage curator) {
        curator = _curators[curatorAddr];
        if (!curator.registered) {
            revert NotRegistered();
        }
    }

    function _accruedFromDebt(uint256 amount, uint256 accYieldPerStakeX18, uint256 rewardDebt)
        internal
        pure
        returns (uint256)
    {
        if (amount == 0) {
            return 0;
        }

        uint256 accrued = Math.mulDiv(amount, accYieldPerStakeX18, SCALE);
        if (accrued <= rewardDebt) {
            return 0;
        }
        return accrued - rewardDebt;
    }

    function _accrueCuratorYield(Curator storage curator) internal {
        uint256 accrued = _accruedFromDebt(curator.selfStake, curator.accYieldPerStakeX18, curator.selfRewardDebt);
        if (accrued > 0) {
            curator.pendingSelfYield += accrued;
        }

        if (curator.selfStake == 0) {
            curator.selfRewardDebt = 0;
        } else {
            curator.selfRewardDebt = Math.mulDiv(curator.selfStake, curator.accYieldPerStakeX18, SCALE);
        }
    }

    function _accrueDelegatorYield(address curatorAddr, address backer, Curator storage curator) internal {
        DelegationPosition storage position = _delegations[curatorAddr][backer];

        uint256 accrued = _accruedFromDebt(position.amount, curator.accYieldPerStakeX18, position.rewardDebt);
        if (accrued > 0) {
            position.pendingYield += accrued;
        }

        if (position.amount == 0) {
            position.rewardDebt = 0;
        } else {
            position.rewardDebt = Math.mulDiv(position.amount, curator.accYieldPerStakeX18, SCALE);
        }
    }

    function _materializeDecay(address curatorAddr, Curator storage curator) internal returns (bool updated) {
        uint8 previousScore = curator.trustScore;
        uint8 decayedScore = TrustMath.decayedScore(
            previousScore, curator.lastTrustUpdate, uint64(block.timestamp), decayEpochSeconds, decayPerEpoch
        );

        if (decayedScore == previousScore) {
            return false;
        }

        curator.trustScore = decayedScore;
        curator.lastTrustUpdate = uint64(block.timestamp);

        int256 delta = -int256(uint256(previousScore - decayedScore));
        emit TrustScoreUpdated(curatorAddr, previousScore, decayedScore, delta);
        return true;
    }

    uint256[50] private __gap;
}
