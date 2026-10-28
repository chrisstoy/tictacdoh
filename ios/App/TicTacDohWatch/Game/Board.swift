import Foundation

enum Player: String, Codable, Equatable {
    case x = "X"
    case o = "O"

    var opponent: Player {
        self == .x ? .o : .x
    }

    var mark: Tile {
        self == .x ? .x : .o
    }
}

enum Tile: String, Codable, Equatable {
    case empty = " "
    case x = "X"
    case o = "O"
}

struct Winner: Equatable {
    var player: Player
    var line: [Int]
}

enum Victory: Equatable {
    case win
    case lose
    case draw
    case none
}

struct BoardNode {
    var board: [Tile]
    var player: Player
    var move: Int
    var victoryState: Victory
    var children: [BoardNode]
}

protocol RandomSource: AnyObject {
    /// Integer in `0..<upperBound`. Callers only pass a positive bound.
    func nextIndex(upperBound: Int) -> Int
}

final class SystemRandomSource: RandomSource {
    func nextIndex(upperBound: Int) -> Int {
        guard upperBound > 0 else { return 0 }
        return Int.random(in: 0..<upperBound)
    }
}

enum AppColor {
    static let backgroundRed = 253.0 / 255.0
    static let backgroundGreen = 222.0 / 255.0
    static let backgroundBlue = 151.0 / 255.0
}
