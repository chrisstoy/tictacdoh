import XCTest
@testable import TicTacDohWatch

private let xWin = RoundRecord(
    board: tiles(["X", "X", "X", " ", "O", " ", "O", " ", "O"]),
    winner: Winner(player: .x, line: [0, 1, 2])
)
private let oWin = RoundRecord(
    board: tiles(["O", "O", "O", " ", "X", " ", "X", " ", "X"]),
    winner: Winner(player: .o, line: [0, 1, 2])
)
private let draw = RoundRecord(
    board: tiles(["X", "O", "X", "O", "X", "O", "O", "X", "X"]),
    winner: nil
)

@MainActor
final class MatchTests: XCTestCase {
    func testPhoneDefaults() {
        let match = MatchModel.phoneDefaults()
        XCTAssertEqual(match.isCPU, [.x: false, .o: false])
        XCTAssertEqual(match.roundsInMatch, 3)
        XCTAssertTrue(match.rounds.isEmpty)
        XCTAssertNil(match.winner)
        XCTAssertFalse(match.isOver)
    }

    func testWatchSetupDefaultsOpponentToCPU() {
        let match = MatchModel.watchSetup()
        XCTAssertEqual(match.isCPU[.x], false)
        XCTAssertEqual(match.isCPU[.o], true)
        XCTAssertEqual(match.roundsInMatch, 3)
    }

    func testMajorityEndsBestOfThree() {
        var match = MatchModel.phoneDefaults()
        match.record(xWin)
        XCTAssertFalse(match.isOver)
        XCTAssertNil(match.winner)
        match.record(xWin)
        XCTAssertTrue(match.isOver)
        XCTAssertEqual(match.winner, .x)
        XCTAssertEqual(match.roundsWon(by: .x), 2)
    }

    func testBestOfFiveAndSeven() {
        var five = MatchModel.phoneDefaults()
        five.roundsInMatch = 5
        five.record(xWin)
        five.record(oWin)
        five.record(xWin)
        XCTAssertNil(five.winner)
        five.record(xWin)
        XCTAssertEqual(five.winner, .x)

        var seven = MatchModel.phoneDefaults()
        seven.roundsInMatch = 7
        seven.record(xWin)
        seven.record(oWin)
        seven.record(xWin)
        seven.record(xWin)
        XCTAssertNil(seven.winner)
        seven.record(xWin)
        XCTAssertEqual(seven.winner, .x)
        XCTAssertEqual(seven.rounds.count, 5)
    }

    func testInfiniteNeverEnds() {
        var match = MatchModel.phoneDefaults()
        match.roundsInMatch = MatchModel.infiniteRounds
        for _ in 0..<10 {
            match.record(xWin)
        }
        XCTAssertNil(match.winner)
        XCTAssertFalse(match.isOver)
        XCTAssertEqual(match.rounds.count, 10)
    }

    func testDoesNotRecordAfterWinnerOrCap() {
        var won = MatchModel.phoneDefaults()
        won.record(xWin)
        won.record(xWin)
        won.record(oWin)
        XCTAssertEqual(won.rounds.count, 2)
        XCTAssertEqual(won.winner, .x)

        var capped = MatchModel.phoneDefaults()
        capped.record(draw)
        capped.record(draw)
        capped.record(draw)
        XCTAssertTrue(capped.isOver)
        XCTAssertNil(capped.winner)
        capped.record(xWin)
        XCTAssertEqual(capped.rounds.count, 3)
    }

    func testMostWinsWhenTheCapIsReachedWithoutAMajority() {
        var match = MatchModel.phoneDefaults()
        match.roundsInMatch = 5
        match.record(xWin)
        match.record(xWin)
        match.record(oWin)
        match.record(draw)
        XCTAssertNil(match.winner)
        match.record(draw)
        XCTAssertEqual(match.rounds.count, 5)
        XCTAssertEqual(match.winner, .x)
        XCTAssertTrue(match.isOver)
    }

    func testOCanWinAndInitKeepsSettings() {
        var match = MatchModel.phoneDefaults()
        match.record(oWin)
        match.record(oWin)
        XCTAssertEqual(match.winner, .o)

        match.isCPU[.x] = true
        match.roundsInMatch = 7
        match.initNewMatch()
        XCTAssertTrue(match.rounds.isEmpty)
        XCTAssertNil(match.winner)
        XCTAssertEqual(match.isCPU[.x], true)
        XCTAssertEqual(match.roundsInMatch, 7)
    }

    func testEarlyMajorityInBestOfFive() {
        var match = MatchModel.phoneDefaults()
        match.roundsInMatch = 5
        match.record(xWin)
        match.record(xWin)
        match.record(xWin)
        XCTAssertEqual(match.winner, .x)
        XCTAssertTrue(match.isOver)
        XCTAssertEqual(match.rounds.count, 3)
    }

    func testDrawsAreNotWins() {
        var match = MatchModel.phoneDefaults()
        match.record(draw)
        XCTAssertEqual(match.roundsWon(by: .x), 0)
        XCTAssertEqual(match.roundsWon(by: .o), 0)
    }

    func testHumanWinThenNextRoundThenMatch() {
        let session = GameSession(match: .phoneDefaults())
        session.startMatch()
        playTopRowWin(session)
        XCTAssertEqual(session.playMode, .roundOver)
        XCTAssertEqual(session.round.winner?.player, .x)
        XCTAssertEqual(session.feedback?.kind, .win)
        session.nextRound()
        XCTAssertEqual(session.playMode, .playing)
        XCTAssertTrue(session.round.board.allSatisfy { $0 == .empty })

        playTopRowWin(session)
        XCTAssertTrue(session.match.isOver)
        session.nextRound()
        XCTAssertEqual(session.playMode, .matchOver)
        XCTAssertEqual(session.match.winner, .x)
    }

    func testCPUPlaysTheFirstScriptedEmptySquare() {
        let session = GameSession(match: .phoneDefaults())
        session.setCPU(.o, true)
        session.startMatch()
        session.placeHuman(at: 0)
        XCTAssertTrue(session.needsCPUMove)
        session.performCPUMove(rng: ZeroRandomSource())
        XCTAssertEqual(session.round.board[0], .x)
        XCTAssertEqual(session.round.board[1], .o)
        XCTAssertEqual(session.feedback?.kind, .place)
    }

    func testBothCPUCannotStartAndQuitReturnsToSetup() {
        let session = GameSession()
        XCTAssertTrue(session.canStart)
        session.setCPU(.x, true)
        XCTAssertFalse(session.canStart)
        session.startMatch()
        XCTAssertEqual(session.playMode, .setupMatch)

        session.setCPU(.x, false)
        session.startMatch()
        session.quit()
        XCTAssertEqual(session.playMode, .setupMatch)
    }

    func testOccupiedTileIsIgnored() {
        var round = RoundModel.newRound()
        XCTAssertTrue(round.apply(at: 0))
        XCTAssertFalse(round.apply(at: 0))
        XCTAssertEqual(round.board[0], .x)
        XCTAssertEqual(round.turn, .o)
    }

    private func playTopRowWin(_ session: GameSession) {
        session.placeHuman(at: 0)
        session.placeHuman(at: 3)
        session.placeHuman(at: 1)
        session.placeHuman(at: 4)
        session.placeHuman(at: 2)
    }
}
