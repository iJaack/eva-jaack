// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {EvaUsageBurner} from "../src/EvaUsageBurner.sol";

contract DeployEvaUsageBurner is Script {
    uint256 internal constant AVALANCHE_MAINNET_CHAIN_ID = 43114;
    address internal constant CONFIRMED_DEPLOYER = 0x0fe61780bd5508b3C99e420662050e5560608cA4;
    address internal constant EVA_TOKEN = 0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672;

    function run() external returns (address burnerAddress) {
        require(block.chainid == AVALANCHE_MAINNET_CHAIN_ID, "Avalanche mainnet only");

        bool hasPrivateKey = vm.envExists("PRIVATE_KEY");
        uint256 deployerPk;
        address deployer = vm.envExists("EVA_DEPLOYER") ? vm.envAddress("EVA_DEPLOYER") : CONFIRMED_DEPLOYER;
        if (hasPrivateKey) {
            deployerPk = uint256(vm.envBytes32("PRIVATE_KEY"));
            deployer = vm.addr(deployerPk);
        }
        require(deployer == CONFIRMED_DEPLOYER, "unexpected deployer");

        if (hasPrivateKey) {
            vm.startBroadcast(deployerPk);
        } else {
            vm.startBroadcast(deployer);
        }
        burnerAddress = address(new EvaUsageBurner(EVA_TOKEN));
        vm.stopBroadcast();

        console2.log("Deployer:", deployer);
        console2.log("EvaUsageBurner:", burnerAddress);
        console2.log("EVA token:", EVA_TOKEN);
    }
}
