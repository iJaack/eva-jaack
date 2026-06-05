// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract EvaThesisProtocol is Initializable, UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    enum ThesisStatus {
        Active,
        Resolved,
        Withdrawn,
        Invalid
    }

    enum SignalKind {
        PredictionMarket,
        Fact
    }

    enum SignalStatus {
        Open,
        Closed,
        Resolved,
        Cancelled
    }

    struct ThesisCore {
        bytes32 thesisId;
        address author;
        ThesisStatus status;
        bytes32 currentRevisionHash;
        uint16 currentScore;
        uint64 createdAt;
        uint64 updatedAt;
    }

    struct PredictionSignal {
        bytes32 signalId;
        bytes32 marketRef;
        bytes32 selectedOutcomeRef;
        uint16 oddsAtAddBps;
        uint16 currentOddsBps;
        uint16 weightBps;
        SignalStatus status;
        bytes32 evidenceRoot;
    }

    struct FactSignal {
        bytes32 signalId;
        bytes32 claimHash;
        uint16 verifierScore;
        uint16 weightBps;
        bytes32 evidenceRoot;
    }

    mapping(bytes32 thesisId => ThesisCore thesis) private _theses;
    mapping(bytes32 thesisId => bytes32[] signalIds) private _thesisSignals;
    mapping(bytes32 signalId => SignalKind kind) public signalKind;
    mapping(bytes32 signalId => PredictionSignal signal) private _predictionSignals;
    mapping(bytes32 signalId => FactSignal signal) private _factSignals;

    event ThesisCreated(bytes32 indexed thesisId, address indexed author, bytes32 revisionHash, uint16 score);
    event RevisionRecorded(bytes32 indexed thesisId, bytes32 indexed revisionHash, uint16 score);
    event PredictionSignalAdded(bytes32 indexed thesisId, bytes32 indexed signalId, bytes32 marketRef, uint16 weightBps);
    event FactSignalAdded(bytes32 indexed thesisId, bytes32 indexed signalId, bytes32 claimHash, uint16 weightBps);
    event SignalUpdated(bytes32 indexed thesisId, bytes32 indexed signalId, uint16 score);
    event ThesisScoreUpdated(bytes32 indexed thesisId, uint16 score);
    event ThesisStatusUpdated(bytes32 indexed thesisId, ThesisStatus status);

    error InvalidAddress();
    error InvalidAmount();
    error ThesisAlreadyExists();
    error ThesisNotFound();
    error Unauthorized();
    error SignalAlreadyExists();
    error SignalNotFound();

    function initialize(address admin, address operator) external initializer {
        if (admin == address(0) || operator == address(0)) revert InvalidAddress();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
    }

    function createThesis(bytes32 thesisId, address author, bytes32 revisionHash, uint16 score) external {
        if (author == address(0) || thesisId == bytes32(0) || revisionHash == bytes32(0)) revert InvalidAddress();
        if (_theses[thesisId].thesisId != bytes32(0)) revert ThesisAlreadyExists();
        _requireAuthorOrOperator(author);
        _validateScore(score);

        _theses[thesisId] = ThesisCore({
            thesisId: thesisId,
            author: author,
            status: ThesisStatus.Active,
            currentRevisionHash: revisionHash,
            currentScore: score,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp)
        });

        emit ThesisCreated(thesisId, author, revisionHash, score);
    }

    function addPredictionSignal(
        bytes32 thesisId,
        bytes32 signalId,
        bytes32 marketRef,
        bytes32 selectedOutcomeRef,
        uint16 oddsAtAddBps,
        uint16 currentOddsBps,
        uint16 weightBps,
        SignalStatus status,
        bytes32 evidenceRoot
    ) external {
        ThesisCore storage thesis = _requireThesis(thesisId);
        _requireAuthorOrOperator(thesis.author);
        _requireNewSignal(signalId);
        _validateBps(oddsAtAddBps);
        _validateBps(currentOddsBps);
        _validateBps(weightBps);

        signalKind[signalId] = SignalKind.PredictionMarket;
        _predictionSignals[signalId] = PredictionSignal({
            signalId: signalId,
            marketRef: marketRef,
            selectedOutcomeRef: selectedOutcomeRef,
            oddsAtAddBps: oddsAtAddBps,
            currentOddsBps: currentOddsBps,
            weightBps: weightBps,
            status: status,
            evidenceRoot: evidenceRoot
        });
        _thesisSignals[thesisId].push(signalId);
        thesis.updatedAt = uint64(block.timestamp);

        emit PredictionSignalAdded(thesisId, signalId, marketRef, weightBps);
    }

    function addFactSignal(
        bytes32 thesisId,
        bytes32 signalId,
        bytes32 claimHash,
        uint16 verifierScore,
        uint16 weightBps,
        bytes32 evidenceRoot
    ) external {
        ThesisCore storage thesis = _requireThesis(thesisId);
        _requireAuthorOrOperator(thesis.author);
        _requireNewSignal(signalId);
        _validateScore(verifierScore);
        _validateBps(weightBps);

        signalKind[signalId] = SignalKind.Fact;
        _factSignals[signalId] = FactSignal({
            signalId: signalId,
            claimHash: claimHash,
            verifierScore: verifierScore,
            weightBps: weightBps,
            evidenceRoot: evidenceRoot
        });
        _thesisSignals[thesisId].push(signalId);
        thesis.updatedAt = uint64(block.timestamp);

        emit FactSignalAdded(thesisId, signalId, claimHash, weightBps);
    }

    function recordRevision(bytes32 thesisId, bytes32 revisionHash, uint16 score) external {
        ThesisCore storage thesis = _requireThesis(thesisId);
        _requireAuthorOrOperator(thesis.author);
        if (revisionHash == bytes32(0)) revert InvalidAddress();
        _validateScore(score);

        thesis.currentRevisionHash = revisionHash;
        thesis.currentScore = score;
        thesis.updatedAt = uint64(block.timestamp);

        emit RevisionRecorded(thesisId, revisionHash, score);
        emit ThesisScoreUpdated(thesisId, score);
    }

    function updateThesisStatus(bytes32 thesisId, ThesisStatus status) external {
        ThesisCore storage thesis = _requireThesis(thesisId);
        _requireAuthorOrOperator(thesis.author);
        thesis.status = status;
        thesis.updatedAt = uint64(block.timestamp);
        emit ThesisStatusUpdated(thesisId, status);
    }

    function getThesis(bytes32 thesisId) external view returns (ThesisCore memory) {
        return _requireThesisView(thesisId);
    }

    function getThesisSignalIds(bytes32 thesisId) external view returns (bytes32[] memory) {
        _requireThesisView(thesisId);
        return _thesisSignals[thesisId];
    }

    function getPredictionSignal(bytes32 signalId) external view returns (PredictionSignal memory) {
        PredictionSignal memory signal = _predictionSignals[signalId];
        if (signal.signalId == bytes32(0)) revert SignalNotFound();
        return signal;
    }

    function getFactSignal(bytes32 signalId) external view returns (FactSignal memory) {
        FactSignal memory signal = _factSignals[signalId];
        if (signal.signalId == bytes32(0)) revert SignalNotFound();
        return signal;
    }

    function _requireThesis(bytes32 thesisId) internal view returns (ThesisCore storage thesis) {
        thesis = _theses[thesisId];
        if (thesis.thesisId == bytes32(0)) revert ThesisNotFound();
    }

    function _requireThesisView(bytes32 thesisId) internal view returns (ThesisCore memory thesis) {
        thesis = _theses[thesisId];
        if (thesis.thesisId == bytes32(0)) revert ThesisNotFound();
    }

    function _requireAuthorOrOperator(address author) internal view {
        if (msg.sender != author && !hasRole(OPERATOR_ROLE, msg.sender)) revert Unauthorized();
    }

    function _requireNewSignal(bytes32 signalId) internal view {
        if (signalId == bytes32(0)) revert InvalidAddress();
        if (_predictionSignals[signalId].signalId != bytes32(0) || _factSignals[signalId].signalId != bytes32(0)) {
            revert SignalAlreadyExists();
        }
    }

    function _validateScore(uint16 score) internal pure {
        if (score > 100) revert InvalidAmount();
    }

    function _validateBps(uint16 value) internal pure {
        if (value > 10_000) revert InvalidAmount();
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
