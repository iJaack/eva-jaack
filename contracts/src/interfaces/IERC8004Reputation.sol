// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC8004Reputation {
    function addReputation(address subject, uint8 score, string calldata tag) external;
}
