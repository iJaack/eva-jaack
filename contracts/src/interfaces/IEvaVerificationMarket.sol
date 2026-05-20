// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEvaVerificationMarket {
    enum SourcePlatform {
        Unknown,
        X,
        Farcaster,
        Web,
        Manual
    }

    enum ClaimType {
        Unknown,
        Factual,
        Event,
        NumericalStatistical,
        QuoteAttribution,
        Onchain,
        MediaBacked,
        Prediction,
        Opinion,
        SatireMeme,
        Unclassifiable
    }

    enum ClaimStatus {
        None,
        Open,
        UnderReview,
        Contested,
        SoftResolved,
        FinalResolved,
        Cancelled,
        Archived
    }

    enum Verdict {
        None,
        Verified,
        LikelyTrue,
        Mixed,
        Misleading,
        LikelyFalse,
        False,
        UnverifiableYet,
        NonFalsifiable
    }

    enum ChallengeStatus {
        None,
        Open,
        Accepted,
        Rejected,
        Expired,
        Settled
    }

    struct ClaimCore {
        bytes32 claimId;
        SourcePlatform sourcePlatform;
        bytes32 sourceRefHash;
        bytes32 claimHash;
        ClaimType claimType;
        ClaimStatus status;
        address creator;
        uint64 createdAt;
        uint64 reviewDeadline;
        uint64 challengeWindowEnd;
        uint64 resolutionTime;
    }

    struct ClaimFunding {
        uint256 feePool;
        uint256 sponsorPool;
        uint256 protocolTopUpPool;
        uint256 challengeBondPool;
        uint256 slashedPool;
        uint256 protocolFeeAccrued;
    }

    struct ClaimResolution {
        Verdict finalVerdict;
        uint32 confidenceBand;
        bytes32 resolutionRoot;
        uint64 resolvedAt;
        bool overturnedByChallenge;
    }

    struct StakePosition {
        uint256 amount;
        Verdict verdict;
        uint32 confidenceBand;
        bytes32 rationaleHash;
        bytes32 evidenceRoot;
        uint64 stakedAt;
        bool claimed;
    }

    struct CuratorAccount {
        bool registered;
        bool isAgent;
        uint64 joinedAt;
        uint32 domainTag;
        uint256 lifetimeStaked;
        uint256 lifetimeEarned;
        uint256 lifetimeSlashed;
    }

    struct Challenge {
        uint256 id;
        address challenger;
        uint256 bondAmount;
        bytes32 reasonHash;
        bytes32 evidenceRoot;
        ChallengeStatus status;
        uint64 openedAt;
        uint64 resolvedAt;
    }

    struct ClaimSettlementPreview {
        uint256 totalStake;
        uint256 totalEligibleRewardPool;
        uint256 totalProtocolFee;
        uint256 challengeBonusPool;
        Verdict leadingVerdict;
        uint32 participantCount;
    }

    function createClaim(
        SourcePlatform sourcePlatform,
        bytes32 sourceRefHash,
        bytes32 claimHash,
        ClaimType claimType,
        uint64 reviewDeadline,
        uint64 challengeWindowEnd,
        bytes32 metadataRoot
    ) external returns (bytes32 claimId);

    function fundClaimFee(bytes32 claimId, uint256 amount) external;
    function fundClaimSponsorPool(bytes32 claimId, uint256 amount) external;
    function topUpClaimFromTreasury(bytes32 claimId, uint256 amount) external;

    function stakeVerdict(
        bytes32 claimId,
        Verdict verdict,
        uint256 amount,
        uint32 confidenceBand,
        bytes32 rationaleHash,
        bytes32 evidenceRoot
    ) external;

    function openChallenge(bytes32 claimId, uint256 bondAmount, bytes32 reasonHash, bytes32 evidenceRoot)
        external
        returns (uint256 challengeId);

    function resolveChallenge(uint256 challengeId, ChallengeStatus status) external;

    function resolveClaim(
        bytes32 claimId,
        Verdict finalVerdict,
        uint32 confidenceBand,
        bytes32 resolutionRoot,
        bool overturnedByChallenge
    ) external;

    function finalizeClaim(bytes32 claimId) external;

    function settleCurator(bytes32 claimId, address curator) external;
    function claimRewards() external;

    function getClaim(bytes32 claimId) external view returns (ClaimCore memory);
    function getClaimFunding(bytes32 claimId) external view returns (ClaimFunding memory);
    function getClaimResolution(bytes32 claimId) external view returns (ClaimResolution memory);
    function getStakePosition(bytes32 claimId, address curator) external view returns (StakePosition memory);
    function previewSettlement(bytes32 claimId, address curator) external view returns (uint256 reward, uint256 slash);
    function getClaimSettlementPreview(bytes32 claimId) external view returns (ClaimSettlementPreview memory);
}
