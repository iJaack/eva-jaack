// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC8004Validation {
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external;
}
