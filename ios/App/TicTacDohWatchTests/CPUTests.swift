import XCTest
@testable import TicTacDohWatch

final class CPUTests: XCTestCase {
    func testPickMoveStaysInsideFixtureSets() throws {
        let fixtures = try FixtureLoader.load()
        for entry in fixtures.cases {
            let board = tiles(entry.board)
            let player = Player(rawValue: entry.turn)!
            XCTAssertEqual(
                Set(immediateWinMoves(board: board, player: player)),
                Set(entry.expectedImmediateWinMoves),
                entry.id
            )
            XCTAssertEqual(
                Set(blockMoves(board: board, player: player)),
                Set(entry.expectedBlockMoves),
                entry.id
            )

            let node = BoardNode(board: board, player: player, move: 0, victoryState: .none, children: [])
            let move = pickMove(node, rng: ZeroRandomSource())
            if entry.expectedMoves.isEmpty {
                XCTAssertNil(move, entry.id)
            } else {
                XCTAssertNotNil(move, entry.id)
                XCTAssertTrue(entry.expectedMoves.contains(move!), entry.id)
            }
        }
    }

    func testEmptyBoardUsesTheInjectedIndex() {
        let board = Array(repeating: Tile.empty, count: 9)
        let node = BoardNode(board: board, player: .x, move: 0, victoryState: .none, children: [])
        for index in 0..<9 {
            XCTAssertEqual(pickMove(node, rng: FixedRandomSource(index)), index)
        }
    }

    func testFinishedBoardReturnsNoMove() {
        let board = tiles(["X", "X", "X", " ", "O", " ", "O", " ", "O"])
        let node = BoardNode(board: board, player: .o, move: 0, victoryState: .none, children: [])
        XCTAssertNil(pickMove(node, rng: ZeroRandomSource()))
    }
}
