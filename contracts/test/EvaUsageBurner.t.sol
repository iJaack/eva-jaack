// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {EvaUsageBurner} from "../src/EvaUsageBurner.sol";

contract MockEvaToken is ERC20 {
    constructor() ERC20("evajaack", "EVA") {
        _mint(msg.sender, 10_000_000_000 ether);
    }
}

contract EvaUsageBurnerTest is Test {
    MockEvaToken internal eva;
    EvaUsageBurner internal burner;
    address internal holder = makeAddr("holder");
    bytes32 internal referenceHash = keccak256("thesis-001");

    function setUp() external {
        eva = new MockEvaToken();
        burner = new EvaUsageBurner(address(eva));
        eva.transfer(holder, 100 ether);
    }

    function testRetiresEvaForAPlatformUseAndEmitsAReceipt() external {
        uint256 totalSupplyBefore = eva.totalSupply();
        vm.startPrank(holder);
        eva.approve(address(burner), 10 ether);

        vm.expectEmit(false, true, true, true, address(burner));
        emit EvaUsageBurner.EvaUsedAndRetired(
            bytes32(0), holder, EvaUsageBurner.UsageKind.ThesisProof, referenceHash, 10 ether, burner.BURN_SINK()
        );
        bytes32 receiptId = burner.retireForUsage(EvaUsageBurner.UsageKind.ThesisProof, referenceHash, 10 ether);
        vm.stopPrank();

        assertNotEq(receiptId, bytes32(0));
        assertEq(eva.balanceOf(holder), 90 ether);
        assertEq(eva.balanceOf(burner.BURN_SINK()), 10 ether);
        assertEq(burner.totalRetired(), 10 ether);
        assertEq(burner.receiptCount(), 1);
        assertEq(eva.totalSupply(), totalSupplyBefore, "legacy token totalSupply must remain unchanged");
    }

    function testRejectsDuplicateUseForTheSameAccountKindAndReference() external {
        vm.startPrank(holder);
        eva.approve(address(burner), 20 ether);
        burner.retireForUsage(EvaUsageBurner.UsageKind.ForecastReceipt, referenceHash, 10 ether);

        vm.expectRevert(EvaUsageBurner.DuplicateUsage.selector);
        burner.retireForUsage(EvaUsageBurner.UsageKind.ForecastReceipt, referenceHash, 10 ether);
        vm.stopPrank();
    }

    function testAllowsTheSameReferenceForADifferentUseKind() external {
        vm.startPrank(holder);
        eva.approve(address(burner), 20 ether);
        burner.retireForUsage(EvaUsageBurner.UsageKind.ThesisProof, referenceHash, 10 ether);
        burner.retireForUsage(EvaUsageBurner.UsageKind.AgentVerification, referenceHash, 10 ether);
        vm.stopPrank();

        assertEq(burner.receiptCount(), 2);
        assertEq(burner.totalRetired(), 20 ether);
    }

    function testRejectsZeroReferenceAndSubMinimumAmount() external {
        vm.startPrank(holder);
        eva.approve(address(burner), 10 ether);

        vm.expectRevert(EvaUsageBurner.InvalidReference.selector);
        burner.retireForUsage(EvaUsageBurner.UsageKind.ThesisProof, bytes32(0), 10 ether);

        vm.expectRevert(EvaUsageBurner.InvalidAmount.selector);
        burner.retireForUsage(EvaUsageBurner.UsageKind.ThesisProof, referenceHash, 1 ether - 1);
        vm.stopPrank();
    }

    function testRequiresHolderApproval() external {
        vm.prank(holder);
        vm.expectRevert();
        burner.retireForUsage(EvaUsageBurner.UsageKind.ThesisProof, referenceHash, 10 ether);
    }
}
