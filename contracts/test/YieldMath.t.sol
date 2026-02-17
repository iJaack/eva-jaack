// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {YieldMath} from "../src/libraries/YieldMath.sol";

contract YieldMathTest is Test {
    function testMultiplierBounds() external {
        assertEq(YieldMath.multiplierBps(0, 8_000, 15_000), 8_000);
        assertEq(YieldMath.multiplierBps(100, 8_000, 15_000), 15_000);
    }

    function testAdjustedYield() external {
        uint256 adjusted = YieldMath.adjustedYield(100e18, 50, 8_000, 15_000);
        assertEq(adjusted, 115e18);
    }

    function testProRata() external {
        assertEq(YieldMath.proRata(1_000e18, 100e18, 1_000e18), 100e18);
        assertEq(YieldMath.proRata(100e18, 0, 1_000e18), 0);
    }

    function testFuzz_AdjustedYieldMonotonic(uint8 scoreA, uint8 scoreB, uint256 baseYield) external {
        scoreA = scoreA % 101;
        scoreB = scoreB % 101;
        baseYield = bound(baseYield, 0, 1_000_000e18);

        uint256 lowScore = scoreA < scoreB ? scoreA : scoreB;
        uint256 highScore = scoreA < scoreB ? scoreB : scoreA;

        uint256 lowYield = YieldMath.adjustedYield(baseYield, uint8(lowScore), 8_000, 15_000);
        uint256 highYield = YieldMath.adjustedYield(baseYield, uint8(highScore), 8_000, 15_000);

        assertLe(lowYield, highYield);
    }
}
