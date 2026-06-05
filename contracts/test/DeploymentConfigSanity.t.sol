// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

contract DeploymentConfigSanityTest is Test {
    address internal constant CONFIG_EVA_TRUST_GRAPH = 0xE84DdD5A03Fa4210c4217436afD2556B348A40a0;
    address internal constant CONFIG_EVA_VERIFICATION_MARKET = 0xfA6893410f19A2c2FC4dd7FA6DB2986de4D3bdad;
    address internal constant CONFIG_EVA_VERIFICATION_REPUTATION_ADAPTER = 0xbEF19ce1451b9a01eE47405E4cfbb31FbA52DF37;

    function testFujiDeployScriptIncludesVerificationMarketAndReputationAdapter() external view {
        string memory script = vm.readFile("script/DeployFuji.s.sol");

        assertTrue(_contains(script, "EvaVerificationMarket"), "market deployment missing");
        assertTrue(_contains(script, "EvaVerificationReputationAdapter"), "adapter deployment missing");
        assertTrue(_contains(script, "computeCreateAddress"), "market/adapter address wiring should be explicit");
    }

    function testMainnetMarketDeployScriptIsAdditiveOnly() external view {
        string memory script = vm.readFile("script/DeployMainnetMarket.s.sol");

        assertTrue(_contains(script, "Avalanche mainnet only"), "mainnet chain guard missing");
        assertTrue(_contains(script, "EVA_DEPLOYER"), "sender override missing");
        assertTrue(_contains(script, "DEFAULT_TRUST_GRAPH"), "existing trust graph constant missing");
        assertTrue(_contains(script, "EVA_TRUST_GRAPH"), "trust graph env override missing");
        assertTrue(_contains(script, "EvaVerificationMarket"), "market deployment missing");
        assertTrue(_contains(script, "EvaVerificationReputationAdapter"), "adapter deployment missing");
        assertTrue(_contains(script, "computeCreateAddress"), "market/adapter address wiring should be explicit");
        assertFalse(_contains(script, "new EvaTrustGraph"), "mainnet market deploy must not deploy a new graph");
    }

    function testMainnetThesisProtocolDeployScriptUsesConfirmedDeployer() external view {
        string memory script = vm.readFile("script/DeployMainnetThesisProtocol.s.sol");

        assertTrue(_contains(script, "Avalanche mainnet only"), "mainnet chain guard missing");
        assertTrue(_contains(script, "DEFAULT_ADMIN"), "default admin missing");
        assertTrue(_contains(script, "0x0fe61780bd5508b3C99e420662050e5560608cA4"), "confirmed deployer missing");
        assertTrue(_contains(script, "unexpected deployer"), "deployer guard missing");
        assertTrue(_contains(script, "EvaThesisProtocol"), "thesis protocol deployment missing");
        assertTrue(_contains(script, "ERC1967Proxy"), "proxy deployment missing");
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

    function testMainnetDeploymentConfigMatchesProtocolMarketAddresses() external view {
        string memory deployment = vm.readFile("deployments/mainnet.json");

        assertEq(vm.parseJsonAddress(deployment, ".contracts.EvaTrustGraph.proxy"), CONFIG_EVA_TRUST_GRAPH);
        assertEq(vm.parseJsonAddress(deployment, ".contracts.EvaVerificationMarket.proxy"), CONFIG_EVA_VERIFICATION_MARKET);
        assertEq(
            vm.parseJsonAddress(deployment, ".contracts.EvaVerificationReputationAdapter.proxy"),
            CONFIG_EVA_VERIFICATION_REPUTATION_ADAPTER
        );
        assertNotEq(vm.parseJsonAddress(deployment, ".contracts.EvaVerificationMarket.implementation"), address(0));
        assertNotEq(
            vm.parseJsonAddress(deployment, ".contracts.EvaVerificationReputationAdapter.implementation"), address(0)
        );
        assertGt(vm.parseJsonUint(deployment, ".contracts.EvaVerificationMarket.deployedBlock"), 0);
        assertGt(vm.parseJsonUint(deployment, ".contracts.EvaVerificationReputationAdapter.deployedBlock"), 0);
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
