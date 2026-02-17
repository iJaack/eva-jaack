// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEvaTrustGraph {
    enum ArticleStatus {
        Pending,
        Verified
    }

    struct Curator {
        bool registered;
        uint256 curatorAgentId;
        uint256 selfStake;
        uint256 delegatedStake;
        uint256 accYieldPerStakeX18;
        uint256 pendingSelfYield;
        uint256 selfRewardDebt;
        uint8 trustScore;
        uint64 registeredAt;
        uint64 lastTrustUpdate;
        uint64 lastArticleAt;
        uint64 articleCount;
    }

    struct DelegationPosition {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingYield;
    }

    struct ArticleSubmission {
        address curator;
        bytes32 articleHash;
        string sourceURI;
        bytes32 requestHash;
        string evidenceURI;
        bytes32 responseHash;
        string validationTag;
        uint64 submittedAt;
        uint64 verifiedAt;
        uint8 verificationScore;
        bool premium;
        ArticleStatus status;
    }

    event CuratorRegistered(
        address indexed curator, uint256 indexed curatorAgentId, uint256 selfStake, uint8 initialTrustScore
    );
    event CuratorDeactivating(address indexed curator, uint256 indexed curatorAgentId);
    event CuratorWithdrawn(address indexed curator, uint256 selfStakeReturned, uint256 yieldClaimed);
    event SelfStakeAdded(address indexed curator, uint256 amount);
    event SelfStakeWithdrawn(address indexed curator, uint256 amount);
    event StakeDelegated(address indexed curator, address indexed backer, uint256 amount);
    event StakeUndelegated(address indexed curator, address indexed backer, uint256 amount);
    event ArticleSubmitted(
        uint256 indexed articleId, address indexed curator, bytes32 indexed articleHash, bytes32 requestHash
    );
    event CuratorTipped(uint256 indexed curatorAgentId, address indexed tipper, uint256 amount);
    event ArticleVerified(
        uint256 indexed articleId,
        address indexed curator,
        uint8 verificationScore,
        uint8 nextTrustScore,
        uint256 allocatedYield,
        string evidenceURI
    );
    event TrustScoreUpdated(address indexed curator, uint8 previousScore, uint8 newScore, int256 delta);
    event YieldFunded(address indexed funder, uint256 amount, uint256 newReserve);
    event YieldAllocated(address indexed curator, uint256 indexed articleId, uint256 amount, uint8 trustScore);
    event YieldClaimed(address indexed curator, address indexed recipient, uint256 amount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event ParametersUpdated(
        uint8 maxScoreDelta,
        uint8 decayPerEpoch,
        uint64 decayEpochSeconds,
        uint256 minSelfStake,
        uint256 minBacking,
        uint256 minYieldMultiplierBps,
        uint256 maxYieldMultiplierBps
    );

    error InvalidAddress();
    error InvalidAmount();
    error InvalidHash();
    error InvalidScore();
    error AlreadyRegistered();
    error NotRegistered();
    error IdentityOwnershipMismatch();
    error StakeBelowMinimum();
    error InsufficientStake();
    error UnauthorizedCurator();
    error ArticleNotFound();
    error ArticleAlreadyVerified();
    error DecayNotDue();
    error NoYield();
    error InvalidMultiplierRange();
    error AgentIdAlreadyRegistered();
    error ActiveBackersExist();

    function initialize(
        address evaToken_,
        address identityRegistry_,
        address reputationRegistry_,
        address validationRegistry_,
        address treasury_,
        address admin_,
        address oracle_
    ) external;

    function registerCurator(uint256 curatorAgentId, uint256 amount) external;

    function increaseSelfStake(uint256 amount) external;

    function withdrawSelfStake(uint256 amount) external;

    function deactivateCurator() external;

    function backCurator(address curator, uint256 amount) external;

    function unbackCurator(address curator, uint256 amount) external;

    function submitArticle(bytes32 articleHash, string calldata sourceURI) external returns (uint256 articleId);

    function submitArticlePremium(bytes32 articleHash, string calldata sourceURI) external returns (uint256 articleId);

    function tipCurator(uint256 curatorAgentId, uint256 amount) external;

    function processVerification(
        uint256 articleId,
        uint8 verificationScore,
        uint256 baseYield,
        string calldata evidenceURI,
        bytes32 responseHash,
        string calldata tag
    ) external;

    function applyDecay(address curator) external;

    function claimDelegatorYield(address curator) external returns (uint256 claimed);

    function claimCuratorYield() external returns (uint256 claimed);

    function fundYield(uint256 amount) external;

    function updateParameters(
        uint8 maxScoreDelta_,
        uint8 decayPerEpoch_,
        uint64 decayEpochSeconds_,
        uint256 minSelfStake_,
        uint256 minBacking_,
        uint256 minYieldMultiplierBps_,
        uint256 maxYieldMultiplierBps_
    ) external;

    function setTreasury(address treasury_) external;

    function getCurator(address curator) external view returns (Curator memory);

    function getDelegation(address curator, address backer) external view returns (DelegationPosition memory);

    function pendingDelegatorYield(address curator, address backer) external view returns (uint256);

    function pendingCuratorYield(address curator) external view returns (uint256);

    function getArticle(uint256 articleId) external view returns (ArticleSubmission memory);

    function getMinStakeForScore(uint8 trustScore) external view returns (uint256);

    function previewVerification(address curator, uint8 verificationScore, uint256 baseYield)
        external
        view
        returns (uint8 nextScore, uint256 adjustedYield);
}
