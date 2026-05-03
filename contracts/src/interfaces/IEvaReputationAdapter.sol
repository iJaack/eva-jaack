// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEvaReputationAdapter {
    function onClaimResolved(bytes32 claimId, uint8 finalVerdict, address[] calldata curatorsInvolved) external;

    function onCuratorSettled(
        address curator,
        bytes32 claimId,
        bool wasCorrect,
        uint256 stakeAmount,
        uint256 rewardAmount,
        uint256 slashAmount,
        uint8 claimType
    ) external;
}
