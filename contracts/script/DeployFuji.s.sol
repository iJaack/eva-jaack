// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {EvaTrustGraph} from "../src/EvaTrustGraph.sol";

contract DeployFuji is Script {
    address internal constant EVA_TOKEN = 0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672;
    address internal constant IDENTITY_REGISTRY = 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432;
    address internal constant REPUTATION_REGISTRY = 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63;
    address internal constant VALIDATION_REGISTRY = 0x5c2B454E34C8E173909EB36FC07DE6143A24ab47;

    function run() external returns (address proxyAddress, address implementationAddress) {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);

        address admin = vm.envExists("EVA_ADMIN") ? vm.envAddress("EVA_ADMIN") : deployer;
        address oracle = vm.envExists("EVA_ORACLE") ? vm.envAddress("EVA_ORACLE") : deployer;
        address treasury = vm.envExists("EVA_TREASURY") ? vm.envAddress("EVA_TREASURY") : deployer;

        vm.startBroadcast(deployerPk);

        EvaTrustGraph implementation = new EvaTrustGraph();
        bytes memory initData = abi.encodeCall(
            EvaTrustGraph.initialize,
            (EVA_TOKEN, IDENTITY_REGISTRY, REPUTATION_REGISTRY, VALIDATION_REGISTRY, treasury, admin, oracle)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        vm.stopBroadcast();

        proxyAddress = address(proxy);
        implementationAddress = address(implementation);

        console2.log("Deployer:", deployer);
        console2.log("EvaTrustGraph implementation:", implementationAddress);
        console2.log("EvaTrustGraph proxy:", proxyAddress);
        console2.log("Admin:", admin);
        console2.log("Oracle:", oracle);
        console2.log("Treasury:", treasury);
    }
}
