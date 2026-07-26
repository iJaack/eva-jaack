// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {EvaThesisProtocol} from "../src/EvaThesisProtocol.sol";

contract EvaThesisProtocolTest is Test {
    EvaThesisProtocol internal protocol;
    address internal admin = address(0xA11CE);
    address internal operator = address(0x0FE617);
    address internal author = address(0xB0B);

    bytes32 internal constant THESIS_ID = keccak256("spacex-ipo-liquidity-thesis");
    bytes32 internal constant REVISION_HASH = keccak256("revision-1");
    bytes32 internal constant SIGNAL_ID = keccak256("signal-1");

    function setUp() external {
        protocol = new EvaThesisProtocol();
        protocol.initialize(admin, operator);
    }

    function testProtocolVersionIsCurrent() external view {
        assertEq(protocol.PROTOCOL_VERSION(), 2);
    }

    function testUupsUpgradePreservesThesisState() external {
        EvaThesisProtocol firstImplementation = new EvaThesisProtocol();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(firstImplementation),
            abi.encodeCall(EvaThesisProtocol.initialize, (admin, operator))
        );
        EvaThesisProtocol proxied = EvaThesisProtocol(address(proxy));

        vm.prank(author);
        proxied.createThesis(THESIS_ID, author, REVISION_HASH, 67);

        EvaThesisProtocol latestImplementation = new EvaThesisProtocol();
        vm.prank(admin);
        proxied.upgradeToAndCall(address(latestImplementation), "");

        EvaThesisProtocol.ThesisCore memory thesis = proxied.getThesis(THESIS_ID);
        assertEq(thesis.author, author);
        assertEq(thesis.currentScore, 67);
        assertEq(proxied.PROTOCOL_VERSION(), 2);
    }

    function testAuthorCanCreateStructuredThesisAndSignals() external {
        vm.prank(author);
        protocol.createThesis(THESIS_ID, author, REVISION_HASH, 67);

        vm.prank(author);
        protocol.addPredictionSignal(
            THESIS_ID,
            SIGNAL_ID,
            keccak256("spacex-ipo-market"),
            keccak256("yes"),
            2400,
            3600,
            6000,
            EvaThesisProtocol.SignalStatus.Open,
            keccak256("market-evidence")
        );

        bytes32 factSignalId = keccak256("fact-signal-1");
        vm.prank(author);
        protocol.addFactSignal(THESIS_ID, factSignalId, keccak256("tender-offer-claim"), 82, 4000, keccak256("fact-report"));

        EvaThesisProtocol.ThesisCore memory thesis = protocol.getThesis(THESIS_ID);
        bytes32[] memory signalIds = protocol.getThesisSignalIds(THESIS_ID);
        EvaThesisProtocol.PredictionSignal memory prediction = protocol.getPredictionSignal(SIGNAL_ID);
        EvaThesisProtocol.FactSignal memory fact = protocol.getFactSignal(factSignalId);

        assertEq(thesis.author, author);
        assertEq(thesis.currentScore, 67);
        assertEq(signalIds.length, 2);
        assertEq(prediction.currentOddsBps, 3600);
        assertEq(fact.verifierScore, 82);
    }

    function testOperatorCanRecordRevisionAndScore() external {
        vm.prank(author);
        protocol.createThesis(THESIS_ID, author, REVISION_HASH, 67);

        bytes32 revisionTwo = keccak256("revision-2");
        vm.prank(operator);
        protocol.recordRevision(THESIS_ID, revisionTwo, 74);

        EvaThesisProtocol.ThesisCore memory thesis = protocol.getThesis(THESIS_ID);
        assertEq(thesis.currentRevisionHash, revisionTwo);
        assertEq(thesis.currentScore, 74);
    }

    function testRejectsUnauthorizedRevision() external {
        vm.prank(author);
        protocol.createThesis(THESIS_ID, author, REVISION_HASH, 67);

        vm.prank(address(0xBAD));
        vm.expectRevert(EvaThesisProtocol.Unauthorized.selector);
        protocol.recordRevision(THESIS_ID, keccak256("bad"), 10);
    }
}
