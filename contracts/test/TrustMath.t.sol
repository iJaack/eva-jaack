// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TrustMath} from "../src/libraries/TrustMath.sol";

contract TrustMathTest is Test {
    function testClamp() external {
        assertEq(TrustMath.clamp(0), 0);
        assertEq(TrustMath.clamp(55), 55);
        assertEq(TrustMath.clamp(101), 100);
    }

    function testBoundedDeltaUpward() external {
        assertEq(TrustMath.boundedDelta(50, 90, 5), 5);
        assertEq(TrustMath.boundedDelta(50, 53, 5), 3);
    }

    function testBoundedDeltaDownward() external {
        assertEq(TrustMath.boundedDelta(50, 10, 5), -5);
        assertEq(TrustMath.boundedDelta(50, 48, 5), -2);
    }

    function testApplyDeltaClamp() external {
        assertEq(TrustMath.applyDelta(98, 5), 100);
        assertEq(TrustMath.applyDelta(2, -5), 0);
        assertEq(TrustMath.applyDelta(50, -4), 46);
    }

    function testDecay() external {
        assertEq(TrustMath.decay(50, 0, 1), 50);
        assertEq(TrustMath.decay(50, 2, 3), 44);
        assertEq(TrustMath.decay(4, 10, 1), 0);
    }

    function testDecayedScoreWithEpochs() external {
        uint8 score = TrustMath.decayedScore(60, uint64(block.timestamp), uint64(block.timestamp + 14 days), 7 days, 2);
        assertEq(score, 56);
    }

    function testGetMinStakeTiers() external {
        assertEq(TrustMath.getMinStake(90), 5_000e18);
        assertEq(TrustMath.getMinStake(65), 10_000e18);
        assertEq(TrustMath.getMinStake(50), 20_000e18);
        assertEq(TrustMath.getMinStake(20), 50_000e18);
    }

    function testFuzz_BoundedDeltaAlwaysWithinMaxStep(uint8 current, uint8 signal, uint8 maxStep) external {
        current = current % 101;
        signal = signal % 101;

        int256 delta = TrustMath.boundedDelta(current, signal, maxStep);

        assertLe(delta, int256(uint256(maxStep)));
        assertGe(delta, -int256(uint256(maxStep)));

        uint8 next = TrustMath.applyDelta(current, delta);
        assertLe(next, 100);
    }
}
