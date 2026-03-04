// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockReputationRegistry {
    uint256 public callCount;
    uint256 public lastAgentId;
    int128 public lastValue;
    uint8 public lastValueDecimals;
    string public lastTag1;
    string public lastTag2;
    string public lastEndpoint;
    string public lastFeedbackURI;
    bytes32 public lastFeedbackHash;

    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        callCount += 1;
        lastAgentId = agentId;
        lastValue = value;
        lastValueDecimals = valueDecimals;
        lastTag1 = tag1;
        lastTag2 = tag2;
        lastEndpoint = endpoint;
        lastFeedbackURI = feedbackURI;
        lastFeedbackHash = feedbackHash;
    }
}
