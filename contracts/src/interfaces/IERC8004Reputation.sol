// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC8004Reputation {
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external;

    function getSummary(uint256 agentId, address[] calldata clientAddresses, string calldata tag1, string calldata tag2)
        external
        view
        returns (uint64, int128, uint8);

    function readFeedback(uint256 agentId, address clientAddress, uint64 feedbackIndex)
        external
        view
        returns (int128, uint8, string memory, string memory, bool);

    function readAllFeedback(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2,
        bool includeRevoked
    )
        external
        view
        returns (address[] memory, uint64[] memory, int128[] memory, uint8[] memory, string[] memory, string[] memory, bool[] memory);

    function getClients(uint256 agentId) external view returns (address[] memory);

    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64);

    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external;

    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external;
}
