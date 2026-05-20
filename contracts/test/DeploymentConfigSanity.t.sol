// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

contract DeploymentConfigSanityTest is Test {
    function testFujiDeployScriptIncludesVerificationMarketAndReputationAdapter() external view {
        string memory script = vm.readFile("script/DeployFuji.s.sol");

        assertTrue(_contains(script, "EvaVerificationMarket"), "market deployment missing");
        assertTrue(_contains(script, "EvaVerificationReputationAdapter"), "adapter deployment missing");
        assertTrue(_contains(script, "computeCreateAddress"), "market/adapter address wiring should be explicit");
    }

    function testMainnetDeploymentConfigHasRequiredTrustGraphAndRegistryAddresses() external view {
        string memory deployment = vm.readFile("deployments/mainnet.json");

        assertEq(vm.parseJsonUint(deployment, ".chainId"), 43114);
        assertNotEq(vm.parseJsonAddress(deployment, ".contracts.EvaTrustGraph.proxy"), address(0));
        assertNotEq(vm.parseJsonAddress(deployment, ".contracts.EvaTrustGraph.implementation"), address(0));
        assertNotEq(vm.parseJsonAddress(deployment, ".externalContracts.evaToken"), address(0));
        assertNotEq(vm.parseJsonAddress(deployment, ".externalContracts.identityRegistry"), address(0));
        assertNotEq(vm.parseJsonAddress(deployment, ".externalContracts.reputationRegistry"), address(0));
        assertNotEq(vm.parseJsonAddress(deployment, ".externalContracts.validationRegistry"), address(0));
    }

    function _contains(string memory haystack, string memory needle) internal pure returns (bool) {
        bytes memory haystackBytes = bytes(haystack);
        bytes memory needleBytes = bytes(needle);

        if (needleBytes.length == 0) {
            return true;
        }
        if (needleBytes.length > haystackBytes.length) {
            return false;
        }

        for (uint256 i = 0; i <= haystackBytes.length - needleBytes.length; i++) {
            bool matched = true;
            for (uint256 j = 0; j < needleBytes.length; j++) {
                if (haystackBytes[i + j] != needleBytes[j]) {
                    matched = false;
                    break;
                }
            }

            if (matched) {
                return true;
            }
        }

        return false;
    }
}
