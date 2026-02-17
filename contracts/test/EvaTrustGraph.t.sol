// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {EvaTrustGraph} from "../src/EvaTrustGraph.sol";
import {IEvaTrustGraph} from "../src/interfaces/IEvaTrustGraph.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockIdentityRegistry} from "./mocks/MockIdentityRegistry.sol";
import {MockValidationRegistry} from "./mocks/MockValidationRegistry.sol";
import {MockReputationRegistry} from "./mocks/MockReputationRegistry.sol";

contract EvaTrustGraphTest is Test {
    MockERC20 internal eva;
    MockIdentityRegistry internal identity;
    MockValidationRegistry internal validation;
    MockReputationRegistry internal reputation;

    EvaTrustGraph internal graph;

    address internal admin = makeAddr("admin");
    address internal oracle = makeAddr("oracle");
    address internal treasury = makeAddr("treasury");
    address internal curator = makeAddr("curator");
    address internal backerA = makeAddr("backerA");
    address internal backerB = makeAddr("backerB");

    uint256 internal constant CURATOR_AGENT_ID = 1599;

    function setUp() external {
        eva = new MockERC20("Eva", "EVA");
        identity = new MockIdentityRegistry();
        validation = new MockValidationRegistry();
        reputation = new MockReputationRegistry();

        identity.setOwner(CURATOR_AGENT_ID, curator);

        EvaTrustGraph implementation = new EvaTrustGraph();
        bytes memory initData = abi.encodeCall(
            EvaTrustGraph.initialize,
            (address(eva), address(identity), address(reputation), address(validation), treasury, admin, oracle)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        graph = EvaTrustGraph(address(proxy));

        _mintAndApprove(curator, 2_000_000e18);
        _mintAndApprove(backerA, 2_000_000e18);
        _mintAndApprove(backerB, 2_000_000e18);
        _mintAndApprove(admin, 2_000_000e18);
    }

    function testRegisterCurator() external {
        vm.prank(curator);
        graph.registerCurator(CURATOR_AGENT_ID, 20_000e18);

        IEvaTrustGraph.Curator memory state = graph.getCurator(curator);
        assertTrue(state.registered);
        assertEq(state.selfStake, 20_000e18);
        assertEq(state.trustScore, 50);
        assertEq(eva.balanceOf(address(graph)), 20_000e18);
    }

    function testRegisterCuratorRevertsWithoutIdentityOwnership() external {
        vm.prank(backerA);
        vm.expectRevert(IEvaTrustGraph.IdentityOwnershipMismatch.selector);
        graph.registerCurator(CURATOR_AGENT_ID, 20_000e18);
    }

    function testBackAndUnbackCurator() external {
        vm.prank(curator);
        graph.registerCurator(CURATOR_AGENT_ID, 20_000e18);

        vm.prank(backerA);
        graph.backCurator(curator, 250e18);

        IEvaTrustGraph.Curator memory curatorState = graph.getCurator(curator);
        IEvaTrustGraph.DelegationPosition memory position = graph.getDelegation(curator, backerA);

        assertEq(curatorState.delegatedStake, 250e18);
        assertEq(position.amount, 250e18);

        vm.prank(backerA);
        graph.unbackCurator(curator, 50e18);

        curatorState = graph.getCurator(curator);
        position = graph.getDelegation(curator, backerA);

        assertEq(curatorState.delegatedStake, 200e18);
        assertEq(position.amount, 200e18);
    }

    function testSubmitAndVerifyUpdatesTrustAndWritesRegistries() external {
        _registerCurator();

        vm.prank(backerA);
        graph.backCurator(curator, 200e18);

        vm.prank(admin);
        graph.fundYield(1_000e18);

        vm.prank(curator);
        uint256 articleId = graph.submitArticle(keccak256("article"), "ipfs://article");

        vm.prank(oracle);
        graph.processVerification(articleId, 90, 100e18, "ipfs://evidence", keccak256("response"), "accuracy");

        IEvaTrustGraph.Curator memory state = graph.getCurator(curator);
        IEvaTrustGraph.ArticleSubmission memory article = graph.getArticle(articleId);

        assertEq(state.trustScore, 55);
        assertEq(uint8(article.status), uint8(IEvaTrustGraph.ArticleStatus.Verified));
        assertEq(validation.callCount(), 1);
        assertEq(reputation.callCount(), 1);
    }

    function testVerificationYieldDistributionLifecycle() external {
        _registerCurator();

        vm.prank(backerA);
        graph.backCurator(curator, 30_000e18);

        vm.prank(backerB);
        graph.backCurator(curator, 60_000e18);

        vm.prank(admin);
        graph.fundYield(5_000e18);

        vm.prank(curator);
        uint256 articleId = graph.submitArticle(keccak256("article-2"), "ipfs://article-2");

        vm.prank(oracle);
        graph.processVerification(articleId, 90, 100e18, "ipfs://evidence-2", keccak256("response-2"), "quality");

        uint256 curatorPending = graph.pendingCuratorYield(curator);
        uint256 backerAPending = graph.pendingDelegatorYield(curator, backerA);
        uint256 backerBPending = graph.pendingDelegatorYield(curator, backerB);

        // trust 50 -> 55, multiplier = 11850 bps, adjusted yield = 118.5 EVA
        uint256 totalPending = curatorPending + backerAPending + backerBPending;
        assertLe(totalPending, 118_500000000000000000);
        assertLe(118_500000000000000000 - totalPending, 1e12);

        uint256 curatorBalanceBefore = eva.balanceOf(curator);
        uint256 backerABalanceBefore = eva.balanceOf(backerA);
        uint256 backerBBalanceBefore = eva.balanceOf(backerB);

        vm.prank(curator);
        uint256 curatorClaim = graph.claimCuratorYield();

        vm.prank(backerA);
        uint256 backerAClaim = graph.claimDelegatorYield(curator);

        vm.prank(backerB);
        uint256 backerBClaim = graph.claimDelegatorYield(curator);

        assertEq(curatorClaim, curatorPending);
        assertEq(backerAClaim, backerAPending);
        assertEq(backerBClaim, backerBPending);

        assertEq(eva.balanceOf(curator), curatorBalanceBefore + curatorClaim);
        assertEq(eva.balanceOf(backerA), backerABalanceBefore + backerAClaim);
        assertEq(eva.balanceOf(backerB), backerBBalanceBefore + backerBClaim);
    }

    function testApplyDecay() external {
        _registerCurator();

        vm.warp(block.timestamp + 14 days);

        vm.prank(backerA);
        graph.applyDecay(curator);

        IEvaTrustGraph.Curator memory state = graph.getCurator(curator);
        assertEq(state.trustScore, 48);

        vm.prank(backerA);
        vm.expectRevert(IEvaTrustGraph.DecayNotDue.selector);
        graph.applyDecay(curator);
    }

    function testNoSlashingStakeRemainsWithdrawable() external {
        vm.prank(curator);
        graph.registerCurator(CURATOR_AGENT_ID, 25_000e18);

        vm.prank(curator);
        uint256 articleId = graph.submitArticle(keccak256("article-3"), "ipfs://article-3");

        vm.prank(oracle);
        graph.processVerification(articleId, 0, 0, "ipfs://evidence-3", keccak256("response-3"), "low_quality");

        IEvaTrustGraph.Curator memory stateBefore = graph.getCurator(curator);
        assertEq(stateBefore.selfStake, 25_000e18);
        assertEq(stateBefore.trustScore, 45);

        uint256 balanceBefore = eva.balanceOf(curator);
        vm.prank(curator);
        graph.withdrawSelfStake(5_000e18);

        IEvaTrustGraph.Curator memory stateAfter = graph.getCurator(curator);
        assertEq(stateAfter.selfStake, 20_000e18);
        assertEq(eva.balanceOf(curator), balanceBefore + 5_000e18);
    }

    function testClaimRevertsWhenNoYield() external {
        _registerCurator();

        vm.prank(curator);
        vm.expectRevert(IEvaTrustGraph.NoYield.selector);
        graph.claimCuratorYield();
    }

    function testPreviewVerificationIncludesReserveCap() external {
        _registerCurator();

        vm.prank(admin);
        graph.fundYield(10e18);

        (uint8 nextScore, uint256 adjustedYield) = graph.previewVerification(curator, 100, 100e18);

        assertEq(nextScore, 55);
        assertEq(adjustedYield, 10e18);
    }

    function testFuzz_TrustScoreMovesGradually(uint8 verificationScore) external {
        verificationScore = uint8(uint256(verificationScore) % 101);

        _registerCurator();

        vm.prank(curator);
        uint256 articleId = graph.submitArticle(keccak256("article-fuzz"), "ipfs://article-fuzz");

        vm.prank(oracle);
        graph.processVerification(
            articleId, verificationScore, 0, "ipfs://evidence-fuzz", keccak256("response-fuzz"), "fuzz"
        );

        IEvaTrustGraph.Curator memory state = graph.getCurator(curator);

        assertLe(state.trustScore, 55);
        assertGe(state.trustScore, 45);
    }

    function testFuzz_VerificationYieldConservation(uint96 rawA, uint96 rawB, uint96 rawBaseYield, uint8 score)
        external
    {
        uint256 delegatedA = bound(uint256(rawA), 100e18, 5_000e18);
        uint256 delegatedB = bound(uint256(rawB), 100e18, 5_000e18);
        uint256 baseYield = bound(uint256(rawBaseYield), 1e18, 2_000e18);
        score = uint8(uint256(score) % 101);

        _registerCurator();

        vm.prank(backerA);
        graph.backCurator(curator, delegatedA);

        vm.prank(backerB);
        graph.backCurator(curator, delegatedB);

        vm.prank(admin);
        graph.fundYield(10_000e18);

        vm.prank(curator);
        uint256 articleId = graph.submitArticle(keccak256("article-fuzz-yield"), "ipfs://article-fuzz-yield");

        uint256 reserveBefore = graph.yieldReserve();

        vm.prank(oracle);
        graph.processVerification(
            articleId, score, baseYield, "ipfs://evidence-fuzz-yield", keccak256("response-fuzz-yield"), "fuzz_yield"
        );

        uint256 reserveAfter = graph.yieldReserve();
        uint256 allocated = reserveBefore - reserveAfter;

        uint256 pendingCurator = graph.pendingCuratorYield(curator);
        uint256 pendingA = graph.pendingDelegatorYield(curator, backerA);
        uint256 pendingB = graph.pendingDelegatorYield(curator, backerB);

        uint256 totalPending = pendingCurator + pendingA + pendingB;
        assertLe(totalPending, allocated);
        assertLe(allocated - totalPending, 1e12);
    }

    function testStandardAndPremiumSubmissionFees() external {
        _registerCurator();

        uint256 reserveBefore = graph.yieldReserve();

        vm.prank(curator);
        graph.submitArticle(keccak256("standard-article"), "ipfs://standard");

        assertEq(graph.yieldReserve(), reserveBefore + graph.submissionFee());

        vm.prank(curator);
        graph.submitArticlePremium(keccak256("premium-article"), "ipfs://premium");

        assertEq(graph.yieldReserve(), reserveBefore + graph.submissionFee() + graph.premiumSubmissionFee());
    }

    function testTipCuratorNoProtocolCut() external {
        _registerCurator();

        uint256 tipAmount = 777e18;
        uint256 curatorBefore = eva.balanceOf(curator);
        uint256 tipperBefore = eva.balanceOf(backerA);
        uint256 reserveBefore = graph.yieldReserve();

        vm.prank(backerA);
        graph.tipCurator(CURATOR_AGENT_ID, tipAmount);

        assertEq(eva.balanceOf(curator), curatorBefore + tipAmount);
        assertEq(eva.balanceOf(backerA), tipperBefore - tipAmount);
        assertEq(graph.yieldReserve(), reserveBefore);
    }

    function testSubmitRevertsWhenCuratorFallsBelowStakeTierRequirement() external {
        vm.prank(curator);
        graph.registerCurator(CURATOR_AGENT_ID, 20_000e18);

        // Push trust low enough that required stake becomes 50,000 $EVA.
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(curator);
            uint256 articleId = graph.submitArticle(keccak256(abi.encodePacked("stake-tier-", i)), "ipfs://stake-tier");

            vm.prank(oracle);
            graph.processVerification(
                articleId,
                0,
                0,
                "ipfs://stake-tier-evidence",
                keccak256(abi.encodePacked("stake-tier-resp-", i)),
                "quality"
            );
        }

        IEvaTrustGraph.Curator memory state = graph.getCurator(curator);
        assertEq(state.trustScore, 35);

        vm.prank(curator);
        vm.expectRevert(IEvaTrustGraph.StakeBelowMinimum.selector);
        graph.submitArticle(keccak256("blocked-by-low-stake"), "ipfs://blocked-by-low-stake");
    }

    function testDeactivateCuratorWithdrawsStakeAndYield() external {
        _registerCurator();

        vm.prank(admin);
        graph.fundYield(1_000e18);

        vm.prank(curator);
        uint256 articleId = graph.submitArticle(keccak256("deactivate"), "ipfs://deactivate");

        vm.prank(oracle);
        graph.processVerification(articleId, 85, 100e18, "ipfs://deactivate-evidence", keccak256("res"), "quality");

        uint256 pendingYield = graph.pendingCuratorYield(curator);
        uint256 stake = graph.getCurator(curator).selfStake;
        uint256 balanceBefore = eva.balanceOf(curator);

        vm.prank(curator);
        graph.deactivateCurator();

        IEvaTrustGraph.Curator memory stateAfter = graph.getCurator(curator);
        assertFalse(stateAfter.registered);
        assertEq(eva.balanceOf(curator), balanceBefore + stake + pendingYield);
    }

    function testDelegatorCanClaimPendingYieldAfterCuratorDeactivation() external {
        _registerCurator();

        vm.prank(backerA);
        graph.backCurator(curator, 1_000e18);

        vm.prank(admin);
        graph.fundYield(2_000e18);

        vm.prank(curator);
        uint256 articleId = graph.submitArticle(keccak256("delegator-post-deactivate"), "ipfs://delegator-post-deactivate");

        vm.prank(oracle);
        graph.processVerification(
            articleId,
            90,
            100e18,
            "ipfs://delegator-post-deactivate-evidence",
            keccak256("delegator-post-deactivate-response"),
            "quality"
        );

        // Materialize all delegator accrual into pendingYield and remove stake.
        vm.prank(backerA);
        graph.unbackCurator(curator, 1_000e18);

        uint256 pending = graph.pendingDelegatorYield(curator, backerA);
        assertGt(pending, 0);

        vm.prank(curator);
        graph.deactivateCurator();

        uint256 balanceBefore = eva.balanceOf(backerA);
        vm.prank(backerA);
        uint256 claimed = graph.claimDelegatorYield(curator);

        assertEq(claimed, pending);
        assertEq(eva.balanceOf(backerA), balanceBefore + claimed);
    }

    function testMinStakeTierExposedByContract() external view {
        assertEq(graph.getMinStakeForScore(85), 10_000e18);
        assertEq(graph.getMinStakeForScore(65), 10_000e18);
        assertEq(graph.getMinStakeForScore(50), 20_000e18);
        assertEq(graph.getMinStakeForScore(10), 50_000e18);
    }

    function _registerCurator() internal {
        vm.prank(curator);
        graph.registerCurator(CURATOR_AGENT_ID, 20_000e18);
    }

    function _mintAndApprove(address user, uint256 amount) internal {
        eva.mint(user, amount);
        vm.prank(user);
        eva.approve(address(graph), type(uint256).max);
    }
}
