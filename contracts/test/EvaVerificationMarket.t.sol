// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {EvaTrustGraph} from "../src/EvaTrustGraph.sol";
import {EvaVerificationMarket} from "../src/EvaVerificationMarket.sol";
import {IEvaTrustGraph} from "../src/interfaces/IEvaTrustGraph.sol";
import {IEvaVerificationMarket} from "../src/interfaces/IEvaVerificationMarket.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockIdentityRegistry} from "./mocks/MockIdentityRegistry.sol";
import {MockValidationRegistry} from "./mocks/MockValidationRegistry.sol";
import {MockReputationRegistry} from "./mocks/MockReputationRegistry.sol";
import {MockReputationAdapter} from "./mocks/MockReputationAdapter.sol";

contract EvaVerificationMarketTest is Test {
    MockERC20 internal eva;
    MockIdentityRegistry internal identity;
    MockValidationRegistry internal validation;
    MockReputationRegistry internal reputation;
    MockReputationAdapter internal adapter;

    EvaTrustGraph internal graph;
    EvaVerificationMarket internal market;

    address internal admin = makeAddr("admin");
    address internal resolver = makeAddr("resolver");
    address internal treasury = makeAddr("treasury");
    address internal curatorA = makeAddr("curatorA");
    address internal curatorB = makeAddr("curatorB");
    address internal outsider = makeAddr("outsider");

    uint256 internal constant CURATOR_A_AGENT_ID = 1599;
    uint256 internal constant CURATOR_B_AGENT_ID = 1600;

    function setUp() external {
        eva = new MockERC20("Eva", "EVA");
        identity = new MockIdentityRegistry();
        validation = new MockValidationRegistry();
        reputation = new MockReputationRegistry();
        adapter = new MockReputationAdapter();

        identity.setOwner(CURATOR_A_AGENT_ID, curatorA);
        identity.setOwner(CURATOR_B_AGENT_ID, curatorB);

        EvaTrustGraph graphImplementation = new EvaTrustGraph();
        bytes memory graphInitData = abi.encodeCall(
            EvaTrustGraph.initialize,
            (address(eva), address(identity), address(reputation), address(validation), treasury, admin, resolver)
        );
        graph = EvaTrustGraph(address(new ERC1967Proxy(address(graphImplementation), graphInitData)));

        EvaVerificationMarket marketImplementation = new EvaVerificationMarket();
        bytes memory marketInitData = abi.encodeCall(
            EvaVerificationMarket.initialize,
            (address(eva), address(graph), treasury, admin, resolver, address(adapter))
        );
        market = EvaVerificationMarket(address(new ERC1967Proxy(address(marketImplementation), marketInitData)));

        _mintAndApprove(curatorA, 2_000_000e18);
        _mintAndApprove(curatorB, 2_000_000e18);
        _mintAndApprove(treasury, 2_000_000e18);
        _mintAndApprove(outsider, 2_000_000e18);

        _registerCurator(curatorA, CURATOR_A_AGENT_ID);
        _registerCurator(curatorB, CURATOR_B_AGENT_ID);
    }

    function testCreateClaimAndPreventDuplicate() external {
        bytes32 claimId = _createDefaultClaim();

        IEvaVerificationMarket.ClaimCore memory claim = market.getClaim(claimId);
        assertEq(claim.claimId, claimId);
        assertEq(uint8(claim.status), uint8(IEvaVerificationMarket.ClaimStatus.Open));
        assertEq(uint8(claim.claimType), uint8(IEvaVerificationMarket.ClaimType.Factual));

        vm.expectRevert(EvaVerificationMarket.ClaimAlreadyExists.selector);
        _createDefaultClaim();
    }

    function testOnlyRegisteredCuratorsCanStakeAndChallenge() external {
        bytes32 claimId = _createDefaultClaim();

        vm.prank(outsider);
        vm.expectRevert(EvaVerificationMarket.CuratorNotRegistered.selector);
        market.stakeVerdict(
            claimId,
            IEvaVerificationMarket.Verdict.Verified,
            100e18,
            80,
            keccak256("outsider-rationale"),
            keccak256("outsider-evidence")
        );

        vm.prank(outsider);
        vm.expectRevert(EvaVerificationMarket.CuratorNotRegistered.selector);
        market.openChallenge(claimId, 50e18, keccak256("outsider-challenge"), keccak256("outsider-proof"));
    }

    function testClaimFundingStakeSettlementAndRewardClaim() external {
        bytes32 claimId = _createDefaultClaim();

        vm.prank(curatorA);
        market.fundClaimFee(claimId, 400e18);

        vm.prank(curatorB);
        market.fundClaimSponsorPool(claimId, 200e18);

        vm.prank(treasury);
        market.topUpClaimFromTreasury(claimId, 100e18);

        vm.prank(curatorA);
        market.stakeVerdict(
            claimId,
            IEvaVerificationMarket.Verdict.Verified,
            200e18,
            88,
            keccak256("curator-a-rationale"),
            keccak256("curator-a-evidence")
        );

        vm.prank(curatorB);
        market.stakeVerdict(
            claimId,
            IEvaVerificationMarket.Verdict.False,
            100e18,
            60,
            keccak256("curator-b-rationale"),
            keccak256("curator-b-evidence")
        );

        vm.prank(curatorA);
        uint256 challengeId = market.openChallenge(
            claimId, 50e18, keccak256("challenge-rationale"), keccak256("challenge-evidence")
        );

        vm.prank(resolver);
        market.resolveChallenge(challengeId, IEvaVerificationMarket.ChallengeStatus.Accepted);

        vm.prank(resolver);
        market.resolveClaim(
            claimId, IEvaVerificationMarket.Verdict.Verified, 91, keccak256("resolution-root"), true
        );

        IEvaVerificationMarket.ClaimCore memory softResolvedClaim = market.getClaim(claimId);
        assertEq(uint8(softResolvedClaim.status), uint8(IEvaVerificationMarket.ClaimStatus.SoftResolved));

        vm.warp(softResolvedClaim.challengeWindowEnd);
        vm.prank(resolver);
        market.finalizeClaim(claimId);

        IEvaVerificationMarket.ClaimSettlementPreview memory preview = market.getClaimSettlementPreview(claimId);
        assertEq(preview.totalStake, 300e18);
        assertEq(preview.participantCount, 2);
        assertEq(uint8(preview.leadingVerdict), uint8(IEvaVerificationMarket.Verdict.Verified));
        assertGt(preview.totalEligibleRewardPool, 0);

        (uint256 winnerReward, uint256 winnerSlash) = market.previewSettlement(claimId, curatorA);
        (uint256 loserReward, uint256 loserSlash) = market.previewSettlement(claimId, curatorB);

        assertGt(winnerReward, loserReward);
        assertEq(winnerSlash, 0);
        assertGt(loserSlash, 0);

        vm.prank(curatorA);
        market.settleCurator(claimId, curatorA);

        vm.prank(curatorB);
        market.settleCurator(claimId, curatorB);

        assertEq(adapter.curatorSettledCallCount(), 2);
        assertEq(adapter.lastResolvedClaimId(), claimId);
        assertEq(adapter.lastSettledClaimId(), claimId);

        uint256 expectedWinnerClaim = 200e18 + winnerReward;
        uint256 expectedLoserClaim = (100e18 - loserSlash) + loserReward;
        assertEq(market.claimableRewards(curatorA), expectedWinnerClaim);
        assertEq(market.claimableRewards(curatorB), expectedLoserClaim);

        uint256 curatorABalanceBefore = eva.balanceOf(curatorA);
        vm.prank(curatorA);
        market.claimRewards();
        assertEq(eva.balanceOf(curatorA), curatorABalanceBefore + expectedWinnerClaim);
    }

    function testSettlementDoesNotRevertWhenAdapterFails() external {
        bytes32 claimId = _createDefaultClaim();

        vm.prank(curatorA);
        market.fundClaimFee(claimId, 200e18);

        vm.prank(curatorA);
        market.stakeVerdict(
            claimId,
            IEvaVerificationMarket.Verdict.Verified,
            100e18,
            75,
            keccak256("rationale"),
            keccak256("evidence")
        );

        adapter.setFailures(false, true);

        vm.prank(resolver);
        market.resolveClaim(
            claimId, IEvaVerificationMarket.Verdict.Verified, 80, keccak256("final-resolution"), false
        );

        IEvaVerificationMarket.ClaimCore memory claim = market.getClaim(claimId);
        vm.warp(claim.challengeWindowEnd);
        vm.prank(resolver);
        market.finalizeClaim(claimId);

        vm.prank(curatorA);
        market.settleCurator(claimId, curatorA);

        assertGt(market.claimableRewards(curatorA), 0);
    }

    function _createDefaultClaim() internal returns (bytes32 claimId) {
        bytes32 sourceRefHash = keccak256("https://x.com/eva/status/1");
        bytes32 claimHash = keccak256("claim-hash");
        bytes32 metadataRoot = keccak256("metadata-root");
        uint64 reviewDeadline = uint64(block.timestamp + 1 days);
        uint64 challengeWindowEnd = uint64(block.timestamp + 3 days);

        claimId = keccak256(
            abi.encode(IEvaVerificationMarket.SourcePlatform.X, sourceRefHash, claimHash)
        );

        market.createClaim(
            IEvaVerificationMarket.SourcePlatform.X,
            sourceRefHash,
            claimHash,
            IEvaVerificationMarket.ClaimType.Factual,
            reviewDeadline,
            challengeWindowEnd,
            metadataRoot
        );
    }

    function _registerCurator(address curator, uint256 agentId) internal {
        vm.prank(curator);
        graph.registerCurator(agentId, 250_000e18);
    }

    function _mintAndApprove(address user, uint256 amount) internal {
        eva.mint(user, amount);
        vm.prank(user);
        eva.approve(address(graph), type(uint256).max);
        vm.prank(user);
        eva.approve(address(market), type(uint256).max);
    }
}
