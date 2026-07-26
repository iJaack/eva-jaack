// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Retires canonical $EVA into an irrecoverable sink and emits a platform-use receipt.
/// @dev The legacy $EVA token's owner-only supply burn is inaccessible because ownership is
///      renounced. This contract therefore reduces circulating supply without changing the
///      token contract's reported totalSupply.
contract EvaUsageBurner {
    using SafeERC20 for IERC20;

    enum UsageKind {
        ThesisProof,
        ForecastReceipt,
        AgentVerification
    }

    IERC20 public immutable EVA;
    address public constant BURN_SINK = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant MINIMUM_RETIREMENT = 1 ether;

    uint256 public totalRetired;
    uint256 public receiptCount;
    mapping(bytes32 receiptKey => bool used) public usedReferences;

    event EvaUsedAndRetired(
        bytes32 indexed receiptId,
        address indexed account,
        UsageKind indexed usageKind,
        bytes32 referenceHash,
        uint256 amount,
        address burnSink
    );

    error InvalidToken();
    error InvalidReference();
    error InvalidAmount();
    error DuplicateUsage();
    error UnexpectedTransferAmount();

    constructor(address evaToken) {
        if (evaToken == address(0) || evaToken.code.length == 0) revert InvalidToken();
        EVA = IERC20(evaToken);
    }

    function retireForUsage(UsageKind usageKind, bytes32 referenceHash, uint256 amount)
        external
        returns (bytes32 receiptId)
    {
        if (referenceHash == bytes32(0)) revert InvalidReference();
        if (amount < MINIMUM_RETIREMENT) revert InvalidAmount();

        bytes32 receiptKey = keccak256(abi.encode(msg.sender, usageKind, referenceHash));
        if (usedReferences[receiptKey]) revert DuplicateUsage();
        usedReferences[receiptKey] = true;

        uint256 sinkBalanceBefore = EVA.balanceOf(BURN_SINK);
        EVA.safeTransferFrom(msg.sender, BURN_SINK, amount);
        uint256 retiredAmount = EVA.balanceOf(BURN_SINK) - sinkBalanceBefore;
        if (retiredAmount != amount) revert UnexpectedTransferAmount();

        totalRetired += amount;
        uint256 nextReceiptCount = receiptCount + 1;
        receiptCount = nextReceiptCount;
        receiptId = keccak256(
            abi.encode(block.chainid, address(this), msg.sender, usageKind, referenceHash, amount, nextReceiptCount)
        );

        emit EvaUsedAndRetired(receiptId, msg.sender, usageKind, referenceHash, amount, BURN_SINK);
    }
}
