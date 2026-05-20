// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IEvaReputationAdapter} from "./interfaces/IEvaReputationAdapter.sol";
import {IEvaTrustGraph} from "./interfaces/IEvaTrustGraph.sol";
import {IERC8004Reputation} from "./interfaces/IERC8004Reputation.sol";

contract EvaVerificationReputationAdapter is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    IEvaReputationAdapter
{
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");

    struct CuratorMarketStats {
        uint256 claimsSettled;
        uint256 correctClaims;
        uint256 lifetimeStake;
        uint256 lifetimeRewards;
        uint256 lifetimeSlashed;
        uint64 lastSettledAt;
    }

    IEvaTrustGraph public trustGraph;
    IERC8004Reputation public reputationRegistry;
    string public feedbackEndpoint;

    mapping(address => CuratorMarketStats) public curatorStats;

    event ClaimResolutionObserved(bytes32 indexed claimId, uint8 finalVerdict, uint256 curatorCount);
    event CuratorSettlementRecorded(
        address indexed curator,
        bytes32 indexed claimId,
        bool wasCorrect,
        uint256 rewardAmount,
        uint256 slashAmount,
        uint8 claimType
    );

    error InvalidAddress();

    function initialize(
        address trustGraph_,
        address reputationRegistry_,
        address admin_,
        address market_,
        string calldata feedbackEndpoint_
    ) external initializer {
        if (
            trustGraph_ == address(0) || reputationRegistry_ == address(0) || admin_ == address(0)
                || market_ == address(0)
        ) {
            revert InvalidAddress();
        }

        __AccessControl_init();
        __UUPSUpgradeable_init();

        trustGraph = IEvaTrustGraph(trustGraph_);
        reputationRegistry = IERC8004Reputation(reputationRegistry_);
        feedbackEndpoint = feedbackEndpoint_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(MARKET_ROLE, market_);
    }

    function onClaimResolved(bytes32 claimId, uint8 finalVerdict, address[] calldata curatorsInvolved)
        external
        onlyRole(MARKET_ROLE)
    {
        emit ClaimResolutionObserved(claimId, finalVerdict, curatorsInvolved.length);
    }

    function onCuratorSettled(
        address curator,
        bytes32 claimId,
        bool wasCorrect,
        uint256 stakeAmount,
        uint256 rewardAmount,
        uint256 slashAmount,
        uint8 claimType
    ) external onlyRole(MARKET_ROLE) {
        CuratorMarketStats storage stats = curatorStats[curator];
        stats.claimsSettled += 1;
        if (wasCorrect) {
            stats.correctClaims += 1;
        }
        stats.lifetimeStake += stakeAmount;
        stats.lifetimeRewards += rewardAmount;
        stats.lifetimeSlashed += slashAmount;
        stats.lastSettledAt = uint64(block.timestamp);

        IEvaTrustGraph.Curator memory curatorState = trustGraph.getCurator(curator);
        if (curatorState.registered && curatorState.curatorAgentId != 0) {
            int128 value = wasCorrect ? int128(100) : -int128(100);
            reputationRegistry.giveFeedback(
                curatorState.curatorAgentId,
                value,
                0,
                "eva_verification_market",
                string.concat("claim_type:", Strings.toString(claimType)),
                feedbackEndpoint,
                "",
                keccak256(abi.encode(curator, claimId, wasCorrect, rewardAmount, slashAmount))
            );
        }

        emit CuratorSettlementRecorded(curator, claimId, wasCorrect, rewardAmount, slashAmount, claimType);
    }

    function setFeedbackEndpoint(string calldata feedbackEndpoint_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        feedbackEndpoint = feedbackEndpoint_;
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
