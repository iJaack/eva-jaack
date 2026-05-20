// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {EvaVerificationMarket} from "../src/EvaVerificationMarket.sol";
import {EvaVerificationReputationAdapter} from "../src/EvaVerificationReputationAdapter.sol";

contract DeployMainnetMarket is Script {
    uint256 internal constant AVALANCHE_MAINNET_CHAIN_ID = 43114;

    address internal constant DEFAULT_EVA_TOKEN = 0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672;
    address internal constant DEFAULT_TRUST_GRAPH = 0xE84DdD5A03Fa4210c4217436afD2556B348A40a0;
    address internal constant DEFAULT_REPUTATION_REGISTRY = 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63;
    address internal constant DEFAULT_ADMIN = 0x0fe61780bd5508b3C99e420662050e5560608cA4;
    address internal constant DEFAULT_TREASURY = 0x0fe61780bd5508b3C99e420662050e5560608cA4;
    string internal constant DEFAULT_FEEDBACK_ENDPOINT = "https://eva.jaack.me/api/claims";

    function run()
        external
        returns (
            address marketProxy,
            address marketImplementationAddress,
            address reputationAdapterProxy,
            address reputationAdapterImplementationAddress
        )
    {
        require(block.chainid == AVALANCHE_MAINNET_CHAIN_ID, "Avalanche mainnet only");

        bool hasPrivateKey = vm.envExists("PRIVATE_KEY");
        uint256 deployerPk;
        address deployer = vm.envExists("EVA_DEPLOYER") ? vm.envAddress("EVA_DEPLOYER") : DEFAULT_ADMIN;
        if (hasPrivateKey) {
            deployerPk = uint256(vm.envBytes32("PRIVATE_KEY"));
            deployer = vm.addr(deployerPk);
        }

        address evaToken = vm.envExists("EVA_TOKEN") ? vm.envAddress("EVA_TOKEN") : DEFAULT_EVA_TOKEN;
        address trustGraph = vm.envExists("EVA_TRUST_GRAPH") ? vm.envAddress("EVA_TRUST_GRAPH") : DEFAULT_TRUST_GRAPH;
        address reputationRegistry = vm.envExists("EVA_REPUTATION_REGISTRY")
            ? vm.envAddress("EVA_REPUTATION_REGISTRY")
            : DEFAULT_REPUTATION_REGISTRY;
        address admin = vm.envExists("EVA_ADMIN") ? vm.envAddress("EVA_ADMIN") : DEFAULT_ADMIN;
        address resolver = vm.envExists("EVA_RESOLVER") ? vm.envAddress("EVA_RESOLVER") : admin;
        address treasury = vm.envExists("EVA_TREASURY") ? vm.envAddress("EVA_TREASURY") : DEFAULT_TREASURY;
        string memory feedbackEndpoint =
            vm.envExists("EVA_FEEDBACK_ENDPOINT") ? vm.envString("EVA_FEEDBACK_ENDPOINT") : DEFAULT_FEEDBACK_ENDPOINT;

        require(evaToken.code.length > 0, "EVA_TOKEN has no code");
        require(trustGraph.code.length > 0, "EVA_TRUST_GRAPH has no code");
        require(reputationRegistry.code.length > 0, "EVA_REPUTATION_REGISTRY has no code");
        require(admin != address(0), "EVA_ADMIN is zero");
        require(resolver != address(0), "EVA_RESOLVER is zero");
        require(treasury != address(0), "EVA_TREASURY is zero");

        uint64 deployerNonce = vm.getNonce(deployer);
        address predictedReputationAdapterProxy = vm.computeCreateAddress(deployer, deployerNonce + 2);
        address predictedMarketProxy = vm.computeCreateAddress(deployer, deployerNonce + 3);

        if (hasPrivateKey) {
            vm.startBroadcast(deployerPk);
        } else {
            vm.startBroadcast(deployer);
        }

        EvaVerificationMarket marketImplementation = new EvaVerificationMarket();
        EvaVerificationReputationAdapter reputationAdapterImplementation = new EvaVerificationReputationAdapter();

        bytes memory reputationAdapterInitData = abi.encodeCall(
            EvaVerificationReputationAdapter.initialize,
            (trustGraph, reputationRegistry, admin, predictedMarketProxy, feedbackEndpoint)
        );
        reputationAdapterProxy =
            address(new ERC1967Proxy(address(reputationAdapterImplementation), reputationAdapterInitData));

        bytes memory marketInitData = abi.encodeCall(
            EvaVerificationMarket.initialize, (evaToken, trustGraph, treasury, admin, resolver, reputationAdapterProxy)
        );
        marketProxy = address(new ERC1967Proxy(address(marketImplementation), marketInitData));

        vm.stopBroadcast();

        require(reputationAdapterProxy == predictedReputationAdapterProxy, "unexpected adapter proxy");
        require(marketProxy == predictedMarketProxy, "unexpected market proxy");

        marketImplementationAddress = address(marketImplementation);
        reputationAdapterImplementationAddress = address(reputationAdapterImplementation);

        console2.log("Deployer:", deployer);
        console2.log("EvaVerificationMarket implementation:", marketImplementationAddress);
        console2.log("EvaVerificationMarket proxy:", marketProxy);
        console2.log("EvaVerificationReputationAdapter implementation:", reputationAdapterImplementationAddress);
        console2.log("EvaVerificationReputationAdapter proxy:", reputationAdapterProxy);
        console2.log("EvaToken:", evaToken);
        console2.log("EvaTrustGraph:", trustGraph);
        console2.log("ERC8004 reputation registry:", reputationRegistry);
        console2.log("Admin:", admin);
        console2.log("Resolver:", resolver);
        console2.log("Treasury:", treasury);
        console2.log("Feedback endpoint:", feedbackEndpoint);
    }
}
