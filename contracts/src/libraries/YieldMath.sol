// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library YieldMath {
    uint256 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Returns the trust-weighted multiplier in basis points for a score in [0, 100].
    function multiplierBps(uint8 trustScore, uint256 minMultiplierBps, uint256 maxMultiplierBps)
        internal
        pure
        returns (uint256)
    {
        if (trustScore > 100) {
            revert InvalidScore();
        }
        if (minMultiplierBps == 0 || maxMultiplierBps < minMultiplierBps) {
            revert InvalidMultiplierRange();
        }

        if (maxMultiplierBps == minMultiplierBps) {
            return minMultiplierBps;
        }

        uint256 spread = maxMultiplierBps - minMultiplierBps;
        uint256 step = Math.mulDiv(spread, trustScore, 100);
        return minMultiplierBps + step;
    }

    /// @notice Applies a trust-weighted multiplier to a base yield value.
    function adjustedYield(uint256 baseYield, uint8 trustScore, uint256 minMultiplierBps, uint256 maxMultiplierBps)
        internal
        pure
        returns (uint256)
    {
        uint256 multiplier = multiplierBps(trustScore, minMultiplierBps, maxMultiplierBps);
        return Math.mulDiv(baseYield, multiplier, BPS_DENOMINATOR);
    }

    /// @notice Splits an amount proportionally using a part/whole ratio.
    function proRata(uint256 amount, uint256 part, uint256 whole) internal pure returns (uint256) {
        if (whole == 0 || part == 0 || amount == 0) {
            return 0;
        }
        return Math.mulDiv(amount, part, whole);
    }

    error InvalidScore();
    error InvalidMultiplierRange();
}
