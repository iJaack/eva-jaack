// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library TrustMath {
    uint8 internal constant MIN_SCORE = 0;
    uint8 internal constant MAX_SCORE = 100;
    uint256 internal constant LOW_TRUST_MIN_STAKE = 50_000e18;
    uint256 internal constant MID_LOW_TRUST_MIN_STAKE = 20_000e18;
    uint256 internal constant MID_TRUST_MIN_STAKE = 10_000e18;
    uint256 internal constant HIGH_TRUST_MIN_STAKE = 5_000e18;

    /// @notice Clamps any value into the inclusive trust-score range [0, 100].
    function clamp(uint256 value) internal pure returns (uint8) {
        if (value > MAX_SCORE) {
            return MAX_SCORE;
        }
        return uint8(value);
    }

    /// @notice Computes a bounded trust-score delta toward the signal score.
    /// @dev Positive values increase trust and negative values decrease trust.
    function boundedDelta(uint8 current, uint8 signal, uint8 maxStep) internal pure returns (int256) {
        if (current > MAX_SCORE || signal > MAX_SCORE) {
            revert InvalidScore();
        }

        if (maxStep == 0 || current == signal) {
            return 0;
        }

        if (signal > current) {
            uint256 up = uint256(signal) - uint256(current);
            uint256 limitedUp = up > maxStep ? maxStep : up;
            return int256(limitedUp);
        }

        uint256 down = uint256(current) - uint256(signal);
        uint256 limitedDown = down > maxStep ? maxStep : down;
        return -int256(limitedDown);
    }

    /// @notice Applies a signed delta to a score and clamps the result to [0, 100].
    function applyDelta(uint8 current, int256 delta) internal pure returns (uint8) {
        if (current > MAX_SCORE) {
            revert InvalidScore();
        }

        int256 raw = int256(uint256(current)) + delta;
        if (raw <= int256(uint256(MIN_SCORE))) {
            return MIN_SCORE;
        }
        if (raw >= int256(uint256(MAX_SCORE))) {
            return MAX_SCORE;
        }
        return uint8(uint256(raw));
    }

    /// @notice Decays trust score by a fixed amount per elapsed epoch.
    function decay(uint8 current, uint256 epochs, uint8 decayPerEpoch) internal pure returns (uint8) {
        if (current > MAX_SCORE) {
            revert InvalidScore();
        }
        if (epochs == 0 || decayPerEpoch == 0) {
            return current;
        }

        uint256 totalDecay = epochs * uint256(decayPerEpoch);
        if (totalDecay >= current) {
            return MIN_SCORE;
        }

        return uint8(uint256(current) - totalDecay);
    }

    /// @notice Computes the decayed score using timestamps and decay parameters.
    function decayedScore(
        uint8 current,
        uint64 lastUpdated,
        uint64 nowTs,
        uint64 decayEpochSeconds,
        uint8 decayPerEpoch
    ) internal pure returns (uint8) {
        if (decayEpochSeconds == 0 || nowTs <= lastUpdated) {
            return current;
        }

        uint256 elapsed = uint256(nowTs - lastUpdated);
        uint256 epochs = elapsed / uint256(decayEpochSeconds);
        return decay(current, epochs, decayPerEpoch);
    }

    /// @notice Returns required self-stake tier based on trust score.
    /// @dev Requirement scales inversely with trust quality.
    function getMinStake(uint8 trustScore) internal pure returns (uint256) {
        if (trustScore > MAX_SCORE) {
            revert InvalidScore();
        }

        if (trustScore >= 80) {
            return HIGH_TRUST_MIN_STAKE;
        }
        if (trustScore >= 60) {
            return MID_TRUST_MIN_STAKE;
        }
        if (trustScore >= 40) {
            return MID_LOW_TRUST_MIN_STAKE;
        }
        return LOW_TRUST_MIN_STAKE;
    }

    error InvalidScore();
}
