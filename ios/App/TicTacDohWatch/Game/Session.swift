import Foundation

enum WatchTiming {
    /// `CPU_MOVE_DELAY_MS` in `src/screens/play/PlayGameScreen.tsx`.
    static let cpuMoveDelayNanoseconds: UInt64 = 500_000_000
}

@MainActor
final class GameSession: ObservableObject {
    @Published var match: MatchModel
    @Published var round: RoundModel
    @Published var playMode: PlayMode
    @Published var feedback: PlacementFeedback?

    private var feedbackToken = 0

    init(match: MatchModel = .watchSetup()) {
        self.match = match
        self.round = .newRound()
        self.playMode = .setupMatch
    }

    func isCPU(_ player: Player) -> Bool {
        match.isCPU[player] ?? false
    }

    var needsCPUMove: Bool {
        playMode == .playing && !round.isOver && isCPU(round.turn)
    }

    var cpuTicket: String {
        let marks = round.board.map(\.rawValue).joined()
        return "\(playMode)-\(round.turn.rawValue)-\(marks)"
    }

    func setCPU(_ player: Player, _ isCPU: Bool) {
        match.isCPU[player] = isCPU
    }

    func setRounds(_ roundsInMatch: Int) {
        match.roundsInMatch = roundsInMatch
    }

    func startMatch() {
        match.initNewMatch()
        round = .newRound()
        playMode = .playing
        feedback = nil
    }

    func quit() {
        playMode = .setupMatch
        feedback = nil
    }

    func nextRound() {
        guard playMode == .roundOver else { return }
        playMode = .setupRound
        if match.isOver {
            playMode = .matchOver
            return
        }
        round = .newRound()
        playMode = .playing
    }

    func newMatch() {
        startMatch()
    }

    func placeHuman(at index: Int) {
        guard playMode == .playing, !needsCPUMove else { return }
        guard round.apply(at: index) else { return }
        notePlacement()
    }

    func performCPUMove(rng: RandomSource = SystemRandomSource()) {
        guard needsCPUMove else { return }
        guard let move = pickNextMove(board: round.board, player: round.turn, rng: rng) else { return }
        guard round.apply(at: move) else { return }
        notePlacement()
    }

    private func notePlacement() {
        if round.isOver {
            match.record(RoundRecord(board: round.board, winner: round.winner))
            playMode = .roundOver
            publish(feedbackForRoundEnd())
        } else {
            publish(.place)
        }
    }

    private func feedbackForRoundEnd() -> FeedbackKind {
        if round.isDraw {
            return .draw
        }
        guard let winner = round.winner?.player else {
            return .draw
        }
        if isCPU(winner) && !isCPU(winner.opponent) {
            return .lose
        }
        return .win
    }

    private func publish(_ kind: FeedbackKind) {
        feedbackToken += 1
        feedback = PlacementFeedback(token: feedbackToken, kind: kind)
    }
}
