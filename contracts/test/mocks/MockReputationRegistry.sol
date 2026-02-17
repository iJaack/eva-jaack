// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockReputationRegistry {
    uint256 public callCount;
    address public lastSubject;
    uint8 public lastScore;
    string public lastTag;

    function addReputation(address subject, uint8 score, string calldata tag) external {
        callCount += 1;
        lastSubject = subject;
        lastScore = score;
        lastTag = tag;
    }
}
