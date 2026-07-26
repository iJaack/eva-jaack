// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

contract DeploymentConfigSanityTest is Test {
    address internal constant CONFIG_EVA_THESIS_PROTOCOL = 0x5eDBd1eea3228662326e60634E53AB8975D6641c;
    address internal constant CONFIG_EVA_USAGE_BURNER = 0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296;
    address internal constant CONFIG_EVA_TOKEN = 0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672;
    address internal constant CONFIRMED_DEPLOYER = 0x0fe61780bd5508b3C99e420662050e5560608cA4;

    function testMainnetThesisProtocolDeployScriptUsesConfirmedDeployer() external view {
        string memory script = vm.readFile("script/DeployMainnetThesisProtocol.s.sol");

        assertTrue(_contains(script, "Avalanche mainnet only"), "mainnet chain guard missing");
        assertTrue(_contains(script, "DEFAULT_ADMIN"), "default admin missing");
        assertTrue(_contains(script, "0x0fe61780bd5508b3C99e420662050e5560608cA4"), "confirmed deployer missing");
        assertTrue(_contains(script, "unexpected deployer"), "deployer guard missing");
        assertTrue(_contains(script, "EvaThesisProtocol"), "thesis protocol deployment missing");
        assertTrue(_contains(script, "ERC1967Proxy"), "proxy deployment missing");
    }

    function testMainnetUsageBurnerDeployScriptUsesConfirmedDeployerAndToken() external view {
        string memory script = vm.readFile("script/DeployEvaUsageBurner.s.sol");

        assertTrue(_contains(script, "Avalanche mainnet only"), "mainnet chain guard missing");
        assertTrue(_contains(script, "unexpected deployer"), "deployer guard missing");
        assertTrue(_contains(script, "0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672"), "canonical token missing");
        assertTrue(_contains(script, "EvaUsageBurner"), "usage burner deployment missing");
    }

    function testMainnetDeploymentConfigRecordsLiveContracts() external view {
        string memory deployment = vm.readFile("deployments/mainnet.json");

        assertEq(vm.parseJsonUint(deployment, ".chainId"), 43114);
        assertEq(vm.parseJsonAddress(deployment, ".deployer"), CONFIRMED_DEPLOYER);
        assertEq(vm.parseJsonAddress(deployment, ".contracts.EvaThesisProtocol.proxy"), CONFIG_EVA_THESIS_PROTOCOL);
        assertNotEq(vm.parseJsonAddress(deployment, ".contracts.EvaThesisProtocol.implementation"), address(0));
        assertGt(vm.parseJsonUint(deployment, ".contracts.EvaThesisProtocol.deployedBlock"), 0);
        assertEq(vm.parseJsonAddress(deployment, ".contracts.EvaUsageBurner.address"), CONFIG_EVA_USAGE_BURNER);
        assertEq(vm.parseJsonAddress(deployment, ".contracts.EvaUsageBurner.token"), CONFIG_EVA_TOKEN);
        assertEq(vm.parseJsonUint(deployment, ".contracts.EvaUsageBurner.deployedBlock"), 91287297);
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
