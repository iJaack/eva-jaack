// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {EvaTrustGraph} from "../src/EvaTrustGraph.sol";
import {EvaVerificationReputationAdapter} from "../src/EvaVerificationReputationAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockIdentityRegistry} from "./mocks/MockIdentityRegistry.sol";
import {MockValidationRegistry} from "./mocks/MockValidationRegistry.sol";
import {MockReputationRegistry} from "./mocks/MockReputationRegistry.sol";

contract EvaVerificationReputationAdapterTest is Test {
    MockERC20 internal eva;
    MockIdentityRegistry internal identity;
    MockValidationRegistry internal validation;
    MockReputationRegistry internal reputation;

    EvaTrustGraph internal graph;
    EvaVerificationReputationAdapter internal adapter;

    address internal admin = makeAddr("admin");
    address internal resolver = makeAddr("resolver");
    address internal treasury = makeAddr("treasury");
    address internal marketAddress = makeAddr("market");
    address internal curator = makeAddr("curator");

    uint256 internal constant CURATOR_AGENT_ID = 1599;

    function setUp() external {
        eva = new MockERC20("Eva", "EVA");
        identity = new MockIdentityRegistry();
        validation = new MockValidationRegistry();
        reputation = new MockReputationRegistry();

        identity.setOwner(CURATOR_AGENT_ID, curator);

        EvaTrustGraph graphImplementation = new EvaTrustGraph();
        bytes memory graphInitData = abi.encodeCall(
            EvaTrustGraph.initialize,
            (address(eva), address(identity), address(reputation), address(validation), treasury, admin, resolver)
        );
        graph = EvaTrustGraph(address(new ERC1967Proxy(address(graphImplementation), graphInitData)));

        EvaVerificationReputationAdapter adapterImplementation = new EvaVerificationReputationAdapter();
        bytes memory adapterInitData = abi.encodeCall(
            EvaVerificationReputationAdapter.initialize,
            (address(graph), address(reputation), admin, marketAddress, "https://eva.jaack.me/api/claims")
        );
        adapter = EvaVerificationReputationAdapter(
            address(new ERC1967Proxy(address(adapterImplementation), adapterInitData))
        );

        eva.mint(curator, 500_000e18);
        vm.prank(curator);
        eva.approve(address(graph), type(uint256).max);

        vm.prank(curator);
        graph.registerCurator(CURATOR_AGENT_ID, 250_000e18);
    }

    function testMarketSettlementUpdatesStatsAndReputationFeedback() external {
        bytes32 claimId = keccak256("claim-id");

        vm.prank(marketAddress);
        adapter.onCuratorSettled(curator, claimId, true, 200e18, 25e18, 0, 1);

        (
            uint256 claimsSettled,
            uint256 correctClaims,
            uint256 lifetimeStake,
            uint256 lifetimeRewards,
            uint256 lifetimeSlashed,
            uint64 lastSettledAt
        ) = adapter.curatorStats(curator);

        assertEq(claimsSettled, 1);
        assertEq(correctClaims, 1);
        assertEq(lifetimeStake, 200e18);
        assertEq(lifetimeRewards, 25e18);
        assertEq(lifetimeSlashed, 0);
        assertGt(lastSettledAt, 0);

        assertEq(reputation.callCount(), 1);
        assertEq(reputation.lastAgentId(), CURATOR_AGENT_ID);
        assertEq(reputation.lastValue(), int128(100));
        assertEq(reputation.lastTag1(), "eva_verification_market");
        assertEq(reputation.lastTag2(), "claim_type:1");
    }

    function testOnlyMarketRoleCanRecordSettlement() external {
        vm.expectRevert();
        adapter.onCuratorSettled(curator, keccak256("claim-id"), true, 100e18, 10e18, 0, 1);
    }

    function testIncorrectSettlementUpdatesStatsAndNegativeReputationFeedback() external {
        bytes32 claimId = keccak256("incorrect-claim-id");

        vm.prank(marketAddress);
        adapter.onCuratorSettled(curator, claimId, false, 150e18, 5e18, 20e18, 6);

        (
            uint256 claimsSettled,
            uint256 correctClaims,
            uint256 lifetimeStake,
            uint256 lifetimeRewards,
            uint256 lifetimeSlashed,
            uint64 lastSettledAt
        ) = adapter.curatorStats(curator);

        assertEq(claimsSettled, 1);
        assertEq(correctClaims, 0);
        assertEq(lifetimeStake, 150e18);
        assertEq(lifetimeRewards, 5e18);
        assertEq(lifetimeSlashed, 20e18);
        assertGt(lastSettledAt, 0);

        assertEq(reputation.callCount(), 1);
        assertEq(reputation.lastAgentId(), CURATOR_AGENT_ID);
        assertEq(reputation.lastValue(), -int128(100));
        assertEq(reputation.lastTag1(), "eva_verification_market");
        assertEq(reputation.lastTag2(), "claim_type:6");
    }

    function testUnregisteredCuratorSettlementUpdatesStatsWithoutRegistryFeedback() external {
        address unregisteredCurator = makeAddr("unregisteredCurator");

        vm.prank(marketAddress);
        adapter.onCuratorSettled(unregisteredCurator, keccak256("claim-id"), true, 100e18, 10e18, 0, 1);

        (uint256 claimsSettled, uint256 correctClaims,,,,) = adapter.curatorStats(unregisteredCurator);

        assertEq(claimsSettled, 1);
        assertEq(correctClaims, 1);
        assertEq(reputation.callCount(), 0);
    }
}
