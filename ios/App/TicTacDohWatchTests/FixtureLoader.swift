import Foundation
import XCTest
@testable import TicTacDohWatch

struct GameFixtureFile: Decodable {
    struct Case: Decodable {
        let id: String
        let board: [String]
        let turn: String
        let expectedWinner: String?
        let expectedLine: [Int]?
        let expectedDraw: Bool
        let expectedImmediateWinMoves: [Int]
        let expectedBlockMoves: [Int]
        let expectedMoves: [Int]
    }

    let cases: [Case]
}

enum FixtureLoader {
    static func load() throws -> GameFixtureFile {
        let bundle = Bundle(for: RulesTests.self)
        let url = try XCTUnwrap(bundle.url(forResource: "game-cases", withExtension: "json"))
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(GameFixtureFile.self, from: data)
    }
}

func tiles(_ marks: [String]) -> [Tile] {
    marks.map { Tile(rawValue: $0) ?? .empty }
}

final class ZeroRandomSource: RandomSource {
    func nextIndex(upperBound: Int) -> Int {
        0
    }
}

final class FixedRandomSource: RandomSource {
    let value: Int
    init(_ value: Int) { self.value = value }
    func nextIndex(upperBound: Int) -> Int {
        guard upperBound > 0 else { return 0 }
        return value % upperBound
    }
}
