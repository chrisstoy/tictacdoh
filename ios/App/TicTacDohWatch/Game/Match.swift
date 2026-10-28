import Foundation

enum PlayMode: Equatable {
    case setupMatch
    case setupRound
    case playing
    case roundOver
    case matchOver
}

struct RoundRecord: Equatable {
    var board: [Tile]
    var winner: Winner?
}

struct RoundModel: Equatable {
    var board: [Tile]
    var turn: Player
    var winner: Winner?
    var isDraw: Bool

    static func newRound() -> RoundModel {
        RoundModel(board: Array(repeating: .empty, count: 9), turn: .x, winner: nil, isDraw: false)
    }

    var isOver: Bool {
        winner != nil || isDraw
    }

    mutating func apply(at index: Int) -> Bool {
        guard !isOver else { return false }
        guard index >= 0, index < 9 else { return false }
        guard board[index] == .empty else { return false }

        board[index] = turn.mark
        winner = determineWinner(board)
        isDraw = winner == nil && !board.contains(.empty)
        if winner == nil && !isDraw {
            turn = turn.opponent
        }
        return true
    }
}

struct MatchModel: Equatable {
    static let infiniteRounds = -1
    static let availableRounds = [3, 5, 7, 9, infiniteRounds]

    var isCPU: [Player: Bool]
    var roundsInMatch: Int
    var rounds: [RoundRecord]
    var winner: Player?

    static func phoneDefaults() -> MatchModel {
        MatchModel(isCPU: [.x: false, .o: false], roundsInMatch: 3, rounds: [], winner: nil)
    }

    /// Watch setup screen: X human, O CPU, best of 3. The phone store starts
    /// both players as human; the watch plan asks for a CPU opponent.
    static func watchSetup() -> MatchModel {
        MatchModel(isCPU: [.x: false, .o: true], roundsInMatch: 3, rounds: [], winner: nil)
    }

    func roundsWon(by player: Player) -> Int {
        rounds.filter { $0.winner?.player == player }.count
    }

    var isOver: Bool {
        guard roundsInMatch != Self.infiniteRounds else { return false }
        return winner != nil || rounds.count >= roundsInMatch
    }

    mutating func initNewMatch() {
        rounds = []
        winner = nil
    }

    mutating func record(_ round: RoundRecord) {
        if winner != nil {
            return
        }
        if roundsInMatch != Self.infiniteRounds && rounds.count >= roundsInMatch {
            return
        }

        rounds.append(round)
        if roundsInMatch == Self.infiniteRounds {
            winner = nil
            return
        }

        let roundsNeededToWin = (roundsInMatch + 1) / 2
        let xWins = roundsWon(by: .x)
        let oWins = roundsWon(by: .o)
        var matchWinner: Player? = xWins >= roundsNeededToWin ? .x : (oWins >= roundsNeededToWin ? .o : nil)
        if matchWinner == nil && rounds.count >= roundsInMatch {
            matchWinner = xWins > oWins ? .x : (oWins > xWins ? .o : nil)
        }
        winner = matchWinner
    }
}

enum FeedbackKind: Equatable {
    case place
    case win
    case lose
    case draw
}

struct PlacementFeedback: Equatable {
    var token: Int
    var kind: FeedbackKind
}
