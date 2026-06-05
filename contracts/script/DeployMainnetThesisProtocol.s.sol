// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {EvaThesisProtocol} from "../src/EvaThesisProtocol.sol";

contract DeployMainnetThesisProtocol is Script {
    uint256 internal constant AVALANCHE_MAINNET_CHAIN_ID = 43114;
    address internal constant DEFAULT_ADMIN = 0x0fe61780bd5508b3C99e420662050e5560608cA4;
    address internal constant DEFAULT_OPERATOR = 0x0fe61780bd5508b3C99e420662050e5560608cA4;

    function run() external returns (address proxy, address implementationAddress) {
        require(block.chainid == AVALANCHE_MAINNET_CHAIN_ID, "Avalanche mainnet only");

        bool hasPrivateKey = vm.envExists("PRIVATE_KEY");
        uint256 deployerPk;
        address deployer = vm.envExists("EVA_DEPLOYER") ? vm.envAddress("EVA_DEPLOYER") : DEFAULT_ADMIN;
        if (hasPrivateKey) {
            deployerPk = uint256(vm.envBytes32("PRIVATE_KEY"));
            deployer = vm.addr(deployerPk);
        }

        address admin = vm.envExists("EVA_ADMIN") ? vm.envAddress("EVA_ADMIN") : DEFAULT_ADMIN;
        address operator = vm.envExists("EVA_OPERATOR") ? vm.envAddress("EVA_OPERATOR") : DEFAULT_OPERATOR;

        require(deployer == DEFAULT_ADMIN, "unexpected deployer");
        require(admin != address(0), "EVA_ADMIN is zero");
        require(operator != address(0), "EVA_OPERATOR is zero");

        if (hasPrivateKey) {
            vm.startBroadcast(deployerPk);
        } else {
            vm.startBroadcast(deployer);
        }

        EvaThesisProtocol implementation = new EvaThesisProtocol();
        bytes memory initData = abi.encodeCall(EvaThesisProtocol.initialize, (admin, operator));
        proxy = address(new ERC1967Proxy(address(implementation), initData));

        vm.stopBroadcast();

        implementationAddress = address(implementation);

        console2.log("Deployer:", deployer);
        console2.log("EvaThesisProtocol implementation:", implementationAddress);
        console2.log("EvaThesisProtocol proxy:", proxy);
        console2.log("Admin:", admin);
        console2.log("Operator:", operator);
    }
}
