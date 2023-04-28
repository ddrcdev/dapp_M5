// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";


/**
 * Supported `sportId`
 * --------------------
 * NCAA Men's Football: 1
 * NFL: 2
 * MLB: 3
 * NBA: 4
 * NCAA Men's Basketball: 5
 * NHL: 6
 * MMA: 7
 * WNBA: 8
 * MLS: 10
 * EPL: 11
 * Ligue 1: 12
 * Bundesliga: 13
 * La Liga: 14
 * Serie A: 15
 * UEFA Champions League: 16
 */

/**
 * Supported `market`
 * --------------------
 * create : Create Market
 * resolve : Resolve Market
 */

/**
 * Supported `statusIds`
 * --------------------
 * 1 : STATUS_CANCELED
 * 2 : STATUS_DELAYED
 * 3 : STATUS_END_OF_FIGHT
 * 4 : STATUS_END_OF_ROUND
 * 5 : STATUS_END_PERIOD
 * 6 : STATUS_FIGHTERS_INTRODUCTION
 * 7 : STATUS_FIGHTERS_WALKING
 * 8 : STATUS_FINAL
 * 9 : STATUS_FINAL_PEN
 * 10 : STATUS_FIRST_HALF
 * 11 : STATUS_FULL_TIME
 * 12 : STATUS_HALFTIME
 * 13 : STATUS_IN_PROGRESS
 * 14 : STATUS_IN_PROGRESS_2
 * 15 : STATUS_POSTPONED
 * 16 : STATUS_PRE_FIGHT
 * 17 : STATUS_RAIN_DELAY
 * 18 : STATUS_SCHEDULED
 * 19 : STATUS_SECOND_HALF
 * 20 : STATUS_TBD
 * 21 : STATUS_UNCONTESTED
 * 22 : STATUS_ABANDONED
 * 23 : STATUS_END_OF_EXTRATIME
 * 24 : STATUS_END_OF_REGULATION
 * 25 : STATUS_FORFEIT
 * 26 : STATUS_HALFTIME_ET
 * 27 : STATUS_OVERTIME
 * 28 : STATUS_SHOOTOUT
 */


contract TherundownLPConsumer_v2_1 is ChainlinkClient {
    using Chainlink for Chainlink.Request;
    using CBORChainlink for BufferChainlink.buffer;

    struct GameCreate {
        bytes32 gameId; //A bytes32 representing a unique identifier for this specific game. Can be used as an input
        uint256 startTime; //A uint256 representing the scheduled start time of the event, formatted as a UNIX timestamp
        string homeTeam; //A string representing the name of the home team, formatted as Team Name + Mascot Name
        string awayTeam; //A string representing the name of the away team, formatted as Team Name + Mascot Name
    }

    struct GameResolve {
        bytes32 gameId; //A bytes32 representing a unique identifier for this specific game. Can be used as an input
        uint8 homeScore; //A uint8 representing the score of the home team
        uint8 awayScore; //A uint8 representing the score of the away team
        uint8 statusId; //A uint8 representing the status of the game. See "Supported statusIds" above to
    }

    bytes32 jobId;

    mapping(bytes32 => bytes[]) public requestIdGames;

    error FailedTransferLINK(address to, uint256 amount);

    /* ========== CONSTRUCTOR ========== */
    constructor() {
        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB); // Dirección LINK en Mumbai
        setChainlinkOracle(0x40193c8518BB267228Fc409a613bDbD8eC5a97b3); // Address operador The Rundown Polygon
        jobId = 0x3764613237303266333766643438653562316239613537313565333530396236; //jobId Polygon
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4 _callbackFunctionId,
        uint256 _expiration
    ) external {
        cancelChainlinkRequest(_requestId, _payment, _callbackFunctionId, _expiration);
    }

    function fulfillGames(bytes32 _requestId, bytes[] memory _games) external recordChainlinkFulfillment(_requestId) {
        requestIdGames[_requestId] = _games;
    }

    /**
     * @notice Returns an Array of game data for a given market, sport ID, date and other filters.
     * @dev Result format is array of either encoded GameCreate tuples or encoded GameResolve tuples.
     * @dev "gameIds" is optional.
     * @dev "statusIds" is optional, and ignored for market "create".
     * @param _payment the LINK amount in Juels (i.e. 10^18 aka 1 LINK).
     * @param _market the type of game data to be queried ("create" or "resolve").
     * @param _sportId the ID of the sport to be queried (see supported sportId).
     * @param _date the date for the games to be queried (format in epoch).
     * @param _gameIds the IDs of the games to be queried (array of game ID as its string representation, e.g.
     * ["23660869053591173981da79133fe4c2", "fb78cede8c9aa942b2569b048e649a3f"]).
     * @param _statusIds the IDs of the statuses to be queried (an array of statusId, e.g. ["1","2","3"],
     * see supported statusIds).
     */
    function requestGamesFiltering(
        uint256 _payment,
        string calldata _market,
        uint256 _sportId,
        uint256 _date,
        bytes32[] memory _gameIds,
        uint256[] memory _statusIds
    ) external {
        Chainlink.Request memory req = buildOperatorRequest(jobId, this.fulfillGames.selector);

        req.add("market", _market);
        req.addUint("sportId", _sportId);
        req.addUint("date", _date);
        req.addStringArray("gameIds", _bytes32ArrayToString(_gameIds)); // NB: optional filter
        _addUintArray(req, "statusIds", _statusIds); // NB: optional filter, ignored for market "create".

        sendOperatorRequest(req, _payment);
    }

    function setOracle(address _oracle) external {
        setChainlinkOracle(_oracle);
    }

    function withdrawLink(address payable _payee, uint256 _amount) external {
        LinkTokenInterface linkToken = LinkTokenInterface(chainlinkTokenAddress());
        if (!linkToken.transfer(_payee, _amount)) {
            revert FailedTransferLINK(_payee, _amount);
        }
    }

    /* ========== EXTERNAL VIEW FUNCTIONS ========== */

    function getGamesCreated(bytes32 _requestId, uint256 _idx) external view returns (GameCreate memory) {
        GameCreate memory game = abi.decode(requestIdGames[_requestId][_idx], (GameCreate));
        return game;
    }

    function getGamesResolved(bytes32 _requestId, uint256 _idx) external view returns (GameResolve memory) {
        GameResolve memory game = abi.decode(requestIdGames[_requestId][_idx], (GameResolve));
        return game;
    }

    function getOracleAddress() external view returns (address) {
        return chainlinkOracleAddress();
    }

    /* ========== PRIVATE PURE FUNCTIONS ========== */

    function _addUintArray(
        Chainlink.Request memory _req,
        string memory _key,
        uint256[] memory _values
    ) private pure {
        Chainlink.Request memory r2 = _req;
        r2.buf.encodeString(_key);
        r2.buf.startArray();
        uint256 valuesLength = _values.length;
        for (uint256 i = 0; i < valuesLength; ) {
            r2.buf.encodeUInt(_values[i]);
            unchecked {
                ++i;
            }
        }
        r2.buf.endSequence();
        _req = r2;
    }

    function _bytes32ArrayToString(bytes32[] memory _bytes32Array) private pure returns (string[] memory) {
        string[] memory gameIds = new string[](_bytes32Array.length);
        for (uint256 i = 0; i < _bytes32Array.length; i++) {
            gameIds[i] = _bytes32ToString(_bytes32Array[i]);
        }
        return gameIds;
    }

    function _bytes32ToString(bytes32 _bytes32) private pure returns (string memory) {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}