// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {EvaTrustGraph} from "../src/EvaTrustGraph.sol";
import {EvaVerificationMarket} from "../src/EvaVerificationMarket.sol";
import {EvaVerificationReputationAdapter} from "../src/EvaVerificationReputationAdapter.sol";

contract DeployFuji is Script {
    address internal constant EVA_TOKEN = 0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672;
    address internal constant IDENTITY_REGISTRY = 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432;
    address internal constant REPUTATION_REGISTRY = 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63;
    address internal constant VALIDATION_REGISTRY = 0x5c2B454E34C8E173909EB36FC07DE6143A24ab47;
    string internal constant DEFAULT_FEEDBACK_ENDPOINT = "https://eva.jaack.me/api/claims";

    function run()
        external
        returns (
            address trustGraphProxy,
            address trustGraphImplementationAddress,
            address marketProxy,
            address marketImplementationAddress,
            address reputationAdapterProxy,
            address reputationAdapterImplementationAddress
        )
    {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);

        address admin = vm.envExists("EVA_ADMIN") ? vm.envAddress("EVA_ADMIN") : deployer;
        address oracle = vm.envExists("EVA_ORACLE") ? vm.envAddress("EVA_ORACLE") : deployer;
        address resolver = vm.envExists("EVA_RESOLVER") ? vm.envAddress("EVA_RESOLVER") : oracle;
        address treasury = vm.envExists("EVA_TREASURY") ? vm.envAddress("EVA_TREASURY") : deployer;
        string memory feedbackEndpoint =
            vm.envExists("EVA_FEEDBACK_ENDPOINT") ? vm.envString("EVA_FEEDBACK_ENDPOINT") : DEFAULT_FEEDBACK_ENDPOINT;

        uint64 deployerNonce = vm.getNonce(deployer);
        address predictedReputationAdapterProxy = vm.computeCreateAddress(deployer, deployerNonce + 4);
        address predictedMarketProxy = vm.computeCreateAddress(deployer, deployerNonce + 5);

        vm.startBroadcast(deployerPk);

        EvaTrustGraph trustGraphImplementation = new EvaTrustGraph();
        bytes memory trustGraphInitData = abi.encodeCall(
            EvaTrustGraph.initialize,
            (EVA_TOKEN, IDENTITY_REGISTRY, REPUTATION_REGISTRY, VALIDATION_REGISTRY, treasury, admin, oracle)
        );
        trustGraphProxy = address(new ERC1967Proxy(address(trustGraphImplementation), trustGraphInitData));

        EvaVerificationMarket marketImplementation = new EvaVerificationMarket();
        EvaVerificationReputationAdapter reputationAdapterImplementation = new EvaVerificationReputationAdapter();

        bytes memory reputationAdapterInitData = abi.encodeCall(
            EvaVerificationReputationAdapter.initialize,
            (trustGraphProxy, REPUTATION_REGISTRY, admin, predictedMarketProxy, feedbackEndpoint)
        );
        reputationAdapterProxy =
            address(new ERC1967Proxy(address(reputationAdapterImplementation), reputationAdapterInitData));

        bytes memory marketInitData = abi.encodeCall(
            EvaVerificationMarket.initialize,
            (EVA_TOKEN, trustGraphProxy, treasury, admin, resolver, reputationAdapterProxy)
        );
        marketProxy = address(new ERC1967Proxy(address(marketImplementation), marketInitData));

        vm.stopBroadcast();

        require(reputationAdapterProxy == predictedReputationAdapterProxy, "unexpected adapter proxy");
        require(marketProxy == predictedMarketProxy, "unexpected market proxy");

        trustGraphImplementationAddress = address(trustGraphImplementation);
        marketImplementationAddress = address(marketImplementation);
        reputationAdapterImplementationAddress = address(reputationAdapterImplementation);

        console2.log("Deployer:", deployer);
        console2.log("EvaTrustGraph implementation:", trustGraphImplementationAddress);
        console2.log("EvaTrustGraph proxy:", trustGraphProxy);
        console2.log("EvaVerificationMarket implementation:", marketImplementationAddress);
        console2.log("EvaVerificationMarket proxy:", marketProxy);
        console2.log("EvaVerificationReputationAdapter implementation:", reputationAdapterImplementationAddress);
        console2.log("EvaVerificationReputationAdapter proxy:", reputationAdapterProxy);
        console2.log("Admin:", admin);
        console2.log("Oracle:", oracle);
        console2.log("Resolver:", resolver);
        console2.log("Treasury:", treasury);
        console2.log("Feedback endpoint:", feedbackEndpoint);
    }
}
