// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IEvaTrustGraph} from "./interfaces/IEvaTrustGraph.sol";
import {IEvaReputationAdapter} from "./interfaces/IEvaReputationAdapter.sol";
import {IEvaVerificationMarket} from "./interfaces/IEvaVerificationMarket.sol";

contract EvaVerificationMarket is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    IEvaVerificationMarket
{
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 private constant BPS_DENOMINATOR = 10_000;

    IERC20 public evaToken;
    IEvaTrustGraph public trustGraph;
    IEvaReputationAdapter public reputationAdapter;
    address public treasury;

    uint256 public nextChallengeId;
    uint256 public minStake;
    uint256 public minChallengeBond;
    uint256 public protocolFeeBps;
    uint256 public maxChallengesPerClaim;
    uint256 public softSlashBps;
    uint256 public reviewerPoolBps;
    uint256 public challengeBonusPoolBps;

    mapping(bytes32 => ClaimCore) private _claims;
    mapping(bytes32 => ClaimFunding) private _claimFunding;
    mapping(bytes32 => ClaimResolution) private _claimResolution;
    mapping(bytes32 => bytes32) public claimMetadataRoots;

    mapping(bytes32 => mapping(Verdict => uint256)) public totalStakeByVerdict;
    mapping(bytes32 => mapping(address => StakePosition)) private _positions;
    mapping(bytes32 => address[]) private _claimParticipants;
    mapping(bytes32 => mapping(address => bool)) private _hasClaimParticipant;

    mapping(bytes32 => uint256[]) private _claimChallengeIds;
    mapping(uint256 => bytes32) public challengeClaimId;
    mapping(uint256 => Challenge) public challenges;

    mapping(address => CuratorAccount) public curators;
    mapping(address => uint256) public claimableRewards;

    event ClaimCreated(
        bytes32 indexed claimId,
        SourcePlatform indexed sourcePlatform,
        bytes32 indexed sourceRefHash,
        bytes32 claimHash,
        ClaimType claimType,
        address creator,
        uint64 reviewDeadline,
        uint64 challengeWindowEnd,
        bytes32 metadataRoot
    );
    event ClaimFunded(bytes32 indexed claimId, address indexed funder, uint256 amount, uint8 poolType);
    event VerdictStaked(
        bytes32 indexed claimId,
        address indexed curator,
        Verdict verdict,
        uint256 amount,
        uint32 confidenceBand,
        bytes32 rationaleHash,
        bytes32 evidenceRoot
    );
    event ChallengeOpened(
        bytes32 indexed claimId,
        uint256 indexed challengeId,
        address indexed challenger,
        uint256 bondAmount,
        bytes32 reasonHash,
        bytes32 evidenceRoot
    );
    event ChallengeResolved(
        bytes32 indexed claimId, uint256 indexed challengeId, ChallengeStatus status, uint64 resolvedAt
    );
    event ClaimResolved(
        bytes32 indexed claimId,
        Verdict finalVerdict,
        uint32 confidenceBand,
        bytes32 resolutionRoot,
        bool overturnedByChallenge,
        uint64 resolvedAt
    );
    event ClaimFinalized(bytes32 indexed claimId, uint64 finalizedAt);
    event StakeSlashed(bytes32 indexed claimId, address indexed curator, uint256 slashAmount, bytes32 reason);
    event CuratorRewardAccrued(bytes32 indexed claimId, address indexed curator, uint256 rewardAmount);
    event CuratorRewardClaimed(address indexed curator, uint256 amount);
    event ReputationHookCalled(bytes32 indexed claimId, address indexed curator, bool wasCorrect);
    event ReputationHookFailed(bytes32 indexed claimId, address indexed curator, bytes errorData);
    event MarketParametersUpdated(
        uint256 minStake,
        uint256 minChallengeBond,
        uint256 protocolFeeBps,
        uint256 maxChallengesPerClaim,
        uint256 softSlashBps,
        uint256 reviewerPoolBps,
        uint256 challengeBonusPoolBps
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event ReputationAdapterUpdated(address indexed oldAdapter, address indexed newAdapter);
    event CuratorAccountTagged(address indexed curator, bool isAgent, uint32 domainTag);

    error InvalidAddress();
    error InvalidAmount();
    error InvalidClaim();
    error InvalidWindow();
    error ClaimAlreadyExists();
    error ClaimNotFound();
    error ClaimNotActive();
    error ClaimNotResolved();
    error ClaimNotSoftResolved();
    error PositionAlreadyExists();
    error NoPosition();
    error AlreadySettled();
    error CuratorNotRegistered();
    error InvalidVerdict();
    error InvalidChallengeStatus();
    error ChallengeLimitReached();
    error ChallengeNotFound();
    error ChallengeNotOpen();
    error ClaimAlreadyFinalized();

    function initialize(
        address evaToken_,
        address trustGraph_,
        address treasury_,
        address admin_,
        address resolver_,
        address reputationAdapter_
    ) external initializer {
        if (
            evaToken_ == address(0) || trustGraph_ == address(0) || treasury_ == address(0) || admin_ == address(0)
                || resolver_ == address(0)
        ) {
            revert InvalidAddress();
        }

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        evaToken = IERC20(evaToken_);
        trustGraph = IEvaTrustGraph(trustGraph_);
        treasury = treasury_;
        reputationAdapter = IEvaReputationAdapter(reputationAdapter_);

        minStake = 100e18;
        minChallengeBond = 50e18;
        protocolFeeBps = 1_000;
        maxChallengesPerClaim = 3;
        softSlashBps = 1_000;
        reviewerPoolBps = 2_500;
        challengeBonusPoolBps = 1_500;

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(TREASURY_ROLE, treasury_);
        _grantRole(RESOLVER_ROLE, resolver_);
        _grantRole(PAUSER_ROLE, admin_);
    }

    function createClaim(
        SourcePlatform sourcePlatform,
        bytes32 sourceRefHash,
        bytes32 claimHash,
        ClaimType claimType,
        uint64 reviewDeadline,
        uint64 challengeWindowEnd,
        bytes32 metadataRoot
    ) external whenNotPaused returns (bytes32 claimId) {
        if (sourceRefHash == bytes32(0) || claimHash == bytes32(0) || metadataRoot == bytes32(0)) {
            revert InvalidClaim();
        }
        if (reviewDeadline == 0 || challengeWindowEnd <= reviewDeadline) {
            revert InvalidWindow();
        }

        claimId = keccak256(abi.encode(sourcePlatform, sourceRefHash, claimHash));
        if (_claims[claimId].claimId != bytes32(0)) {
            revert ClaimAlreadyExists();
        }

        _claims[claimId] = ClaimCore({
            claimId: claimId,
            sourcePlatform: sourcePlatform,
            sourceRefHash: sourceRefHash,
            claimHash: claimHash,
            claimType: claimType,
            status: ClaimStatus.Open,
            creator: msg.sender,
            createdAt: uint64(block.timestamp),
            reviewDeadline: reviewDeadline,
            challengeWindowEnd: challengeWindowEnd,
            resolutionTime: 0
        });
        claimMetadataRoots[claimId] = metadataRoot;

        emit ClaimCreated(
            claimId,
            sourcePlatform,
            sourceRefHash,
            claimHash,
            claimType,
            msg.sender,
            reviewDeadline,
            challengeWindowEnd,
            metadataRoot
        );
    }

    function fundClaimFee(bytes32 claimId, uint256 amount) external whenNotPaused {
        _fundClaim(claimId, amount, 1);
        _claimFunding[claimId].feePool += amount;
    }

    function fundClaimSponsorPool(bytes32 claimId, uint256 amount) external whenNotPaused {
        _fundClaim(claimId, amount, 2);
        _claimFunding[claimId].sponsorPool += amount;
    }

    function topUpClaimFromTreasury(bytes32 claimId, uint256 amount) external whenNotPaused onlyRole(TREASURY_ROLE) {
        _fundClaim(claimId, amount, 3);
        _claimFunding[claimId].protocolTopUpPool += amount;
    }

    function stakeVerdict(
        bytes32 claimId,
        Verdict verdict,
        uint256 amount,
        uint32 confidenceBand,
        bytes32 rationaleHash,
        bytes32 evidenceRoot
    ) external whenNotPaused nonReentrant {
        ClaimCore storage claim = _requireActiveClaim(claimId);
        _requireRegisteredCurator(msg.sender);
        if (amount < minStake) revert InvalidAmount();
        if (verdict == Verdict.None) revert InvalidVerdict();
        if (_positions[claimId][msg.sender].amount != 0) revert PositionAlreadyExists();

        evaToken.safeTransferFrom(msg.sender, address(this), amount);

        _positions[claimId][msg.sender] = StakePosition({
            amount: amount,
            verdict: verdict,
            confidenceBand: confidenceBand,
            rationaleHash: rationaleHash,
            evidenceRoot: evidenceRoot,
            stakedAt: uint64(block.timestamp),
            claimed: false
        });

        totalStakeByVerdict[claimId][verdict] += amount;
        if (!_hasClaimParticipant[claimId][msg.sender]) {
            _hasClaimParticipant[claimId][msg.sender] = true;
            _claimParticipants[claimId].push(msg.sender);
        }

        CuratorAccount storage curator = _ensureCuratorAccount(msg.sender);
        curator.lifetimeStaked += amount;
        if (claim.status == ClaimStatus.Open && block.timestamp >= claim.reviewDeadline) {
            claim.status = ClaimStatus.UnderReview;
        }

        emit VerdictStaked(claimId, msg.sender, verdict, amount, confidenceBand, rationaleHash, evidenceRoot);
    }

    function openChallenge(
        bytes32 claimId,
        uint256 bondAmount,
        bytes32 reasonHash,
        bytes32 evidenceRoot
    ) external whenNotPaused nonReentrant returns (uint256 challengeId) {
        ClaimCore storage claim = _requireClaim(claimId);
        _requireRegisteredCurator(msg.sender);
        if (bondAmount < minChallengeBond) revert InvalidAmount();
        if (
            claim.status == ClaimStatus.FinalResolved || claim.status == ClaimStatus.Cancelled
                || claim.status == ClaimStatus.Archived
        ) {
            revert ClaimNotActive();
        }
        if (_claimChallengeIds[claimId].length >= maxChallengesPerClaim) {
            revert ChallengeLimitReached();
        }

        evaToken.safeTransferFrom(msg.sender, address(this), bondAmount);

        challengeId = ++nextChallengeId;
        challenges[challengeId] = Challenge({
            id: challengeId,
            challenger: msg.sender,
            bondAmount: bondAmount,
            reasonHash: reasonHash,
            evidenceRoot: evidenceRoot,
            status: ChallengeStatus.Open,
            openedAt: uint64(block.timestamp),
            resolvedAt: 0
        });
        challengeClaimId[challengeId] = claimId;
        _claimChallengeIds[claimId].push(challengeId);
        _claimFunding[claimId].challengeBondPool += bondAmount;
        claim.status = ClaimStatus.Contested;

        emit ChallengeOpened(claimId, challengeId, msg.sender, bondAmount, reasonHash, evidenceRoot);
    }

    function resolveChallenge(uint256 challengeId, ChallengeStatus status) external onlyRole(RESOLVER_ROLE) {
        Challenge storage challenge = challenges[challengeId];
        bytes32 claimId = challengeClaimId[challengeId];
        if (challenge.id == 0 || claimId == bytes32(0)) revert ChallengeNotFound();
        if (challenge.status != ChallengeStatus.Open) revert ChallengeNotOpen();
        if (status != ChallengeStatus.Accepted && status != ChallengeStatus.Rejected && status != ChallengeStatus.Expired)
        {
            revert InvalidChallengeStatus();
        }

        challenge.status = status;
        challenge.resolvedAt = uint64(block.timestamp);

        emit ChallengeResolved(claimId, challengeId, status, challenge.resolvedAt);
    }

    function resolveClaim(
        bytes32 claimId,
        Verdict finalVerdict,
        uint32 confidenceBand,
        bytes32 resolutionRoot,
        bool overturnedByChallenge
    ) external onlyRole(RESOLVER_ROLE) {
        ClaimCore storage claim = _requireClaim(claimId);
        if (
            claim.status == ClaimStatus.FinalResolved || claim.status == ClaimStatus.Cancelled
                || claim.status == ClaimStatus.Archived
        ) {
            revert ClaimAlreadyFinalized();
        }
        if (finalVerdict == Verdict.None || resolutionRoot == bytes32(0)) revert InvalidClaim();

        claim.status = block.timestamp >= claim.challengeWindowEnd ? ClaimStatus.FinalResolved : ClaimStatus.SoftResolved;
        claim.resolutionTime = uint64(block.timestamp);

        _claimResolution[claimId] = ClaimResolution({
            finalVerdict: finalVerdict,
            confidenceBand: confidenceBand,
            resolutionRoot: resolutionRoot,
            resolvedAt: uint64(block.timestamp),
            overturnedByChallenge: overturnedByChallenge
        });

        _notifyClaimResolved(claimId, finalVerdict);

        emit ClaimResolved(claimId, finalVerdict, confidenceBand, resolutionRoot, overturnedByChallenge, uint64(block.timestamp));
    }

    function finalizeClaim(bytes32 claimId) external onlyRole(RESOLVER_ROLE) {
        ClaimCore storage claim = _requireClaim(claimId);
        if (claim.status != ClaimStatus.SoftResolved) revert ClaimNotSoftResolved();
        if (block.timestamp < claim.challengeWindowEnd) revert ClaimNotResolved();

        claim.status = ClaimStatus.FinalResolved;
        claim.resolutionTime = uint64(block.timestamp);

        emit ClaimFinalized(claimId, uint64(block.timestamp));
    }

    function settleCurator(bytes32 claimId, address curator) external nonReentrant {
        ClaimCore storage claim = _requireClaim(claimId);
        if (claim.status != ClaimStatus.FinalResolved) revert ClaimNotResolved();

        StakePosition storage position = _positions[claimId][curator];
        if (position.amount == 0) revert NoPosition();
        if (position.claimed) revert AlreadySettled();

        (uint256 reward, uint256 slash) = _previewSettlement(claimId, curator);
        position.claimed = true;

        ClaimFunding storage funding = _claimFunding[claimId];
        uint256 principalReturned = position.amount - slash;
        if (slash != 0) {
            funding.slashedPool += slash;
            emit StakeSlashed(claimId, curator, slash, bytes32("incorrect_verdict"));
        }

        uint256 accrual = principalReturned + reward;
        claimableRewards[curator] += accrual;
        funding.protocolFeeAccrued = _computeProtocolFee(funding);

        CuratorAccount storage curatorAccount = _ensureCuratorAccount(curator);
        curatorAccount.lifetimeEarned += reward;
        curatorAccount.lifetimeSlashed += slash;

        emit CuratorRewardAccrued(claimId, curator, reward);

        bool wasCorrect = position.verdict == _claimResolution[claimId].finalVerdict;
        _notifyCuratorSettled(
            curator,
            claimId,
            wasCorrect,
            position.amount,
            reward,
            slash,
            uint8(_claims[claimId].claimType)
        );
    }

    function claimRewards() external nonReentrant {
        uint256 amount = claimableRewards[msg.sender];
        if (amount == 0) revert InvalidAmount();

        claimableRewards[msg.sender] = 0;
        evaToken.safeTransfer(msg.sender, amount);

        emit CuratorRewardClaimed(msg.sender, amount);
    }

    function updateMarketParameters(
        uint256 minStake_,
        uint256 minChallengeBond_,
        uint256 protocolFeeBps_,
        uint256 maxChallengesPerClaim_,
        uint256 softSlashBps_,
        uint256 reviewerPoolBps_,
        uint256 challengeBonusPoolBps_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (
            protocolFeeBps_ > BPS_DENOMINATOR || softSlashBps_ > BPS_DENOMINATOR || reviewerPoolBps_ > BPS_DENOMINATOR
                || challengeBonusPoolBps_ > BPS_DENOMINATOR
                || reviewerPoolBps_ + challengeBonusPoolBps_ > BPS_DENOMINATOR
        ) revert InvalidAmount();

        minStake = minStake_;
        minChallengeBond = minChallengeBond_;
        protocolFeeBps = protocolFeeBps_;
        maxChallengesPerClaim = maxChallengesPerClaim_;
        softSlashBps = softSlashBps_;
        reviewerPoolBps = reviewerPoolBps_;
        challengeBonusPoolBps = challengeBonusPoolBps_;

        emit MarketParametersUpdated(
            minStake_,
            minChallengeBond_,
            protocolFeeBps_,
            maxChallengesPerClaim_,
            softSlashBps_,
            reviewerPoolBps_,
            challengeBonusPoolBps_
        );
    }

    function setTreasury(address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (treasury_ == address(0)) revert InvalidAddress();
        address oldTreasury = treasury;
        treasury = treasury_;
        _grantRole(TREASURY_ROLE, treasury_);
        emit TreasuryUpdated(oldTreasury, treasury_);
    }

    function setReputationAdapter(address reputationAdapter_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldAdapter = address(reputationAdapter);
        reputationAdapter = IEvaReputationAdapter(reputationAdapter_);
        emit ReputationAdapterUpdated(oldAdapter, reputationAdapter_);
    }

    function setCuratorAccountTag(bool isAgent, uint32 domainTag) external {
        CuratorAccount storage curator = _ensureCuratorAccount(msg.sender);
        curator.isAgent = isAgent;
        curator.domainTag = domainTag;
        emit CuratorAccountTagged(msg.sender, isAgent, domainTag);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function getClaim(bytes32 claimId) external view returns (ClaimCore memory) {
        return _claims[claimId];
    }

    function getClaimFunding(bytes32 claimId) external view returns (ClaimFunding memory) {
        return _claimFunding[claimId];
    }

    function getClaimResolution(bytes32 claimId) external view returns (ClaimResolution memory) {
        return _claimResolution[claimId];
    }

    function getStakePosition(bytes32 claimId, address curator) external view returns (StakePosition memory) {
        return _positions[claimId][curator];
    }

    function previewSettlement(bytes32 claimId, address curator) external view returns (uint256 reward, uint256 slash) {
        return _previewSettlement(claimId, curator);
    }

    function getClaimSettlementPreview(bytes32 claimId) external view returns (ClaimSettlementPreview memory) {
        ClaimFunding memory funding = _claimFunding[claimId];
        ClaimResolution memory resolution = _claimResolution[claimId];
        uint256 totalStake = _totalStakeForClaim(claimId);
        uint32 participantCount = uint32(_claimParticipants[claimId].length);
        uint256 totalSlashed = _totalPotentialSlash(claimId, resolution.finalVerdict);
        uint256 basePool = funding.feePool + funding.sponsorPool + funding.protocolTopUpPool + funding.challengeBondPool;
        uint256 protocolFee = (basePool * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 rewardPool = basePool - protocolFee + totalSlashed;

        return ClaimSettlementPreview({
            totalStake: totalStake,
            totalEligibleRewardPool: rewardPool,
            totalProtocolFee: protocolFee,
            challengeBonusPool: _challengeRewardPool(basePool),
            leadingVerdict: _leadingVerdict(claimId),
            participantCount: participantCount
        });
    }

    function getClaimChallengeIds(bytes32 claimId) external view returns (uint256[] memory) {
        return _claimChallengeIds[claimId];
    }

    function getCuratorAccount(address curator) external view returns (CuratorAccount memory) {
        return curators[curator];
    }

    function _fundClaim(bytes32 claimId, uint256 amount, uint8 poolType) internal {
        _requireClaim(claimId);
        if (amount == 0) revert InvalidAmount();

        evaToken.safeTransferFrom(msg.sender, address(this), amount);
        emit ClaimFunded(claimId, msg.sender, amount, poolType);
    }

    function _previewSettlement(bytes32 claimId, address curator) internal view returns (uint256 reward, uint256 slash) {
        ClaimResolution memory resolution = _claimResolution[claimId];
        StakePosition memory position = _positions[claimId][curator];
        if (resolution.finalVerdict == Verdict.None || position.amount == 0) {
            return (0, 0);
        }

        ClaimFunding memory funding = _claimFunding[claimId];
        uint256 basePool = funding.feePool + funding.sponsorPool + funding.protocolTopUpPool + funding.challengeBondPool;
        uint256 protocolFee = (basePool * protocolFeeBps) / BPS_DENOMINATOR;
        uint256 reviewerPool = (basePool * reviewerPoolBps) / BPS_DENOMINATOR;
        uint256 challengePool = _challengeRewardPool(basePool);
        uint256 totalSlashed = _totalPotentialSlash(claimId, resolution.finalVerdict);
        uint256 accuracyPool = basePool - protocolFee - reviewerPool - challengePool + totalSlashed;

        uint256 participantCount = _claimParticipants[claimId].length;
        uint256 reviewerReward = participantCount == 0 ? 0 : reviewerPool / participantCount;

        if (position.verdict == resolution.finalVerdict) {
            uint256 winningStake = totalStakeByVerdict[claimId][resolution.finalVerdict];
            uint256 accuracyReward = winningStake == 0 ? 0 : (accuracyPool * position.amount) / winningStake;
            uint256 challengeReward = _challengeRewardForCurator(claimId, curator, challengePool);
            reward = reviewerReward + accuracyReward + challengeReward;
            slash = 0;
        } else {
            reward = reviewerReward;
            slash = (position.amount * softSlashBps) / BPS_DENOMINATOR;
        }
    }

    function _challengeRewardPool(uint256 basePool) internal view returns (uint256) {
        return (basePool * challengeBonusPoolBps) / BPS_DENOMINATOR;
    }

    function _challengeRewardForCurator(bytes32 claimId, address curator, uint256 challengePool)
        internal
        view
        returns (uint256)
    {
        uint256[] memory ids = _claimChallengeIds[claimId];
        uint256 acceptedCount;
        bool isAcceptedChallenger;

        for (uint256 i = 0; i < ids.length; i++) {
            Challenge memory challenge = challenges[ids[i]];
            if (challenge.status == ChallengeStatus.Accepted) {
                acceptedCount += 1;
                if (challenge.challenger == curator) {
                    isAcceptedChallenger = true;
                }
            }
        }

        if (!isAcceptedChallenger || acceptedCount == 0) {
            return 0;
        }

        return challengePool / acceptedCount;
    }

    function _totalPotentialSlash(bytes32 claimId, Verdict finalVerdict) internal view returns (uint256 total) {
        address[] memory participants = _claimParticipants[claimId];

        for (uint256 i = 0; i < participants.length; i++) {
            StakePosition memory position = _positions[claimId][participants[i]];
            if (position.verdict != finalVerdict) {
                total += (position.amount * softSlashBps) / BPS_DENOMINATOR;
            }
        }
    }

    function _totalStakeForClaim(bytes32 claimId) internal view returns (uint256 total) {
        address[] memory participants = _claimParticipants[claimId];
        for (uint256 i = 0; i < participants.length; i++) {
            total += _positions[claimId][participants[i]].amount;
        }
    }

    function _leadingVerdict(bytes32 claimId) internal view returns (Verdict leading) {
        uint256 topStake;
        for (uint256 i = 1; i <= uint256(type(Verdict).max); i++) {
            Verdict verdict = Verdict(i);
            uint256 stake = totalStakeByVerdict[claimId][verdict];
            if (stake > topStake) {
                topStake = stake;
                leading = verdict;
            }
        }
    }

    function _computeProtocolFee(ClaimFunding memory funding) internal view returns (uint256) {
        uint256 basePool = funding.feePool + funding.sponsorPool + funding.protocolTopUpPool + funding.challengeBondPool;
        return (basePool * protocolFeeBps) / BPS_DENOMINATOR;
    }

    function _ensureCuratorAccount(address curatorAddr) internal returns (CuratorAccount storage curator) {
        curator = curators[curatorAddr];
        if (!curator.registered) {
            curator.registered = true;
            curator.joinedAt = uint64(block.timestamp);
        }
    }

    function _requireRegisteredCurator(address curatorAddr) internal view {
        IEvaTrustGraph.Curator memory curatorState = trustGraph.getCurator(curatorAddr);
        if (!curatorState.registered) revert CuratorNotRegistered();
    }

    function _requireClaim(bytes32 claimId) internal view returns (ClaimCore storage claim) {
        claim = _claims[claimId];
        if (claim.claimId == bytes32(0)) revert ClaimNotFound();
    }

    function _requireActiveClaim(bytes32 claimId) internal view returns (ClaimCore storage claim) {
        claim = _requireClaim(claimId);
        if (
            claim.status == ClaimStatus.FinalResolved || claim.status == ClaimStatus.Cancelled
                || claim.status == ClaimStatus.Archived
        ) {
            revert ClaimNotActive();
        }
        if (block.timestamp > claim.challengeWindowEnd) {
            revert ClaimNotActive();
        }
    }

    function _notifyClaimResolved(bytes32 claimId, Verdict finalVerdict) internal {
        if (address(reputationAdapter) == address(0)) {
            return;
        }

        address[] memory participants = _claimParticipants[claimId];
        try reputationAdapter.onClaimResolved(claimId, uint8(finalVerdict), participants) {} catch (bytes memory err) {
            emit ReputationHookFailed(claimId, address(0), err);
        }
    }

    function _notifyCuratorSettled(
        address curator,
        bytes32 claimId,
        bool wasCorrect,
        uint256 stakeAmount,
        uint256 rewardAmount,
        uint256 slashAmount,
        uint8 claimType
    ) internal {
        if (address(reputationAdapter) == address(0)) {
            return;
        }

        try reputationAdapter.onCuratorSettled(
            curator, claimId, wasCorrect, stakeAmount, rewardAmount, slashAmount, claimType
        ) {
            emit ReputationHookCalled(claimId, curator, wasCorrect);
        } catch (bytes memory err) {
            emit ReputationHookFailed(claimId, curator, err);
        }
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
