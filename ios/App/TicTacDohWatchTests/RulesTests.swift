import XCTest
@testable import TicTacDohWatch

final class RulesTests: XCTestCase {
    func testFixturesMatchDetermineWinner() throws {
        let fixtures = try FixtureLoader.load()
        for entry in fixtures.cases {
            let board = tiles(entry.board)
            let winner = determineWinner(board)
            if let expected = entry.expectedWinner {
                XCTAssertEqual(winner?.player.rawValue, expected, entry.id)
                XCTAssertEqual(winner?.line, entry.expectedLine, entry.id)
            } else {
                XCTAssertNil(winner, entry.id)
            }
            XCTAssertEqual(isBoardDraw(board), entry.expectedDraw, entry.id)
        }
    }

    func testVoiceOverLabels() {
        XCTAssertEqual(VoiceOverTile.label(index: 0, tile: .empty), "Top left, empty")
        XCTAssertEqual(VoiceOverTile.label(index: 4, tile: .x), "Center, X")
        XCTAssertEqual(VoiceOverTile.label(index: 8, tile: .o), "Bottom right, O")
    }
}
