// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockValidationRegistry {
    uint256 public callCount;
    bytes32 public lastRequestHash;
    uint8 public lastResponse;
    string public lastResponseURI;
    bytes32 public lastResponseHash;
    string public lastTag;

    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        callCount += 1;
        lastRequestHash = requestHash;
        lastResponse = response;
        lastResponseURI = responseURI;
        lastResponseHash = responseHash;
        lastTag = tag;
    }
}
