// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEvaReputationAdapter} from "../../src/interfaces/IEvaReputationAdapter.sol";

contract MockReputationAdapter is IEvaReputationAdapter {
    bool public failOnClaimResolved;
    bool public failOnCuratorSettled;

    bytes32 public lastResolvedClaimId;
    uint8 public lastResolvedVerdict;
    uint256 public lastResolvedCuratorCount;

    address public lastSettledCurator;
    bytes32 public lastSettledClaimId;
    bool public lastSettledWasCorrect;
    uint256 public lastSettledStakeAmount;
    uint256 public lastSettledRewardAmount;
    uint256 public lastSettledSlashAmount;
    uint8 public lastSettledClaimType;
    uint256 public curatorSettledCallCount;

    function setFailures(bool failOnClaimResolved_, bool failOnCuratorSettled_) external {
        failOnClaimResolved = failOnClaimResolved_;
        failOnCuratorSettled = failOnCuratorSettled_;
    }

    function onClaimResolved(bytes32 claimId, uint8 finalVerdict, address[] calldata curatorsInvolved) external {
        if (failOnClaimResolved) {
            revert("mock_claim_resolution_failure");
        }

        lastResolvedClaimId = claimId;
        lastResolvedVerdict = finalVerdict;
        lastResolvedCuratorCount = curatorsInvolved.length;
    }

    function onCuratorSettled(
        address curator,
        bytes32 claimId,
        bool wasCorrect,
        uint256 stakeAmount,
        uint256 rewardAmount,
        uint256 slashAmount,
        uint8 claimType
    ) external {
        if (failOnCuratorSettled) {
            revert("mock_curator_settlement_failure");
        }

        curatorSettledCallCount += 1;
        lastSettledCurator = curator;
        lastSettledClaimId = claimId;
        lastSettledWasCorrect = wasCorrect;
        lastSettledStakeAmount = stakeAmount;
        lastSettledRewardAmount = rewardAmount;
        lastSettledSlashAmount = slashAmount;
        lastSettledClaimType = claimType;
    }
}
