import SwiftUI

struct PlayView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 4) {
            board
                .layoutPriority(1)
            if session.playMode == .roundOver {
                RoundOverView(session: session)
            } else if session.playMode == .matchOver {
                MatchOverView(session: session)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background)
        .toolbar(.hidden, for: .navigationBar)
        .safeAreaInset(edge: .top, spacing: 2) {
            scoreBar
        }
        .task(id: session.cpuTicket) {
            guard session.needsCPUMove else { return }
            do {
                try await Task.sleep(nanoseconds: WatchTiming.cpuMoveDelayNanoseconds)
            } catch {
                return
            }
            guard !Task.isCancelled, session.needsCPUMove else { return }
            session.performCPUMove()
        }
    }

    private var board: some View {
        GeometryReader { geo in
            let lineWidth: CGFloat = 4
            let side = min(geo.size.width, geo.size.height)
            // 3 tiles + 2 internal lines + outer frame (line on each side).
            let tile = max((side - lineWidth * 4) / 3, 1)
            let boardSide = tile * 3 + lineWidth * 4
            VStack(spacing: lineWidth) {
                ForEach(0..<3, id: \.self) { row in
                    HStack(spacing: lineWidth) {
                        ForEach(0..<3, id: \.self) { column in
                            let index = row * 3 + column
                            TileView(
                                index: index,
                                tile: session.round.board[index],
                                side: tile,
                                highlighted: session.round.winner?.line.contains(index) ?? false,
                                enabled: session.playMode == .playing && !session.needsCPUMove && !session.round.isOver
                            ) {
                                session.placeHuman(at: index)
                            }
                        }
                    }
                }
            }
            .padding(lineWidth)
            .background(boardLine, in: RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous))
            .frame(width: boardSide, height: boardSide)
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }

    /// Same dark line art as phone `border` (#632f16).
    private var boardLine: Color {
        Color(red: 99 / 255, green: 47 / 255, blue: 22 / 255)
    }

    private var scoreBar: some View {
        HStack(spacing: 6) {
            playerScore(.x)
            VStack(spacing: 2) {
                Button {
                    session.quit()
                } label: {
                    WordmarkText("QUIT", size: 12)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(
                            RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous)
                                .fill(Color.white.opacity(0.65))
                                .overlay(
                                    RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous)
                                        .strokeBorder(ink.opacity(0.4), lineWidth: 1.5)
                                )
                        )
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Quit")
                Text(roundLabel)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(ink)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
            }
            .frame(minWidth: 44)
            playerScore(.o)
        }
        .padding(.horizontal, 4)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(scoreAccessibilityLabel)
    }

    private func playerScore(_ player: Player) -> some View {
        let wins = session.match.roundsWon(by: player)
        let isTurn = session.playMode == .playing
            && !session.round.isOver
            && session.round.turn == player
        return TurnScorePill(player: player, wins: wins, isTurn: isTurn, ink: ink)
    }

    private var roundLabel: String {
        let cap = session.match.roundsInMatch == MatchModel.infiniteRounds
            ? "∞"
            : "\(session.match.roundsInMatch)"
        let shownRound = session.playMode == .playing
            ? session.match.rounds.count + 1
            : max(session.match.rounds.count, 1)
        return "\(shownRound)/\(cap)"
    }

    private var scoreAccessibilityLabel: String {
        "Score X \(session.match.roundsWon(by: .x)), O \(session.match.roundsWon(by: .o)), round \(roundLabel)"
    }

    private var background: Color {
        Color(red: AppColor.backgroundRed, green: AppColor.backgroundGreen, blue: AppColor.backgroundBlue)
    }

    private var ink: Color {
        Color(red: 0.169, green: 0.149, blue: 0.173)
    }
}

/// Score chip that gently pulses while it is that player's turn.
/// Uses `TimelineView` (not `repeatForever`) so the pulse can't leak to the
/// other score pill and stops immediately when `isTurn` becomes false.
private struct TurnScorePill: View {
    var player: Player
    var wins: Int
    var isTurn: Bool
    var ink: Color

    private let highlight = Color(red: 0.769, green: 0.435, blue: 0.141)

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 20.0, paused: !isTurn)) { context in
            let pulse = isTurn ? turnPulseAmount(at: context.date) : 0
            HStack(spacing: 3) {
                MarkCanvas(name: player == .x ? "MarkX" : "MarkO")
                    .frame(width: 18, height: 18)
                Text("\(wins)")
                    .font(.title3.weight(.bold))
                    .monospacedDigit()
                    .foregroundStyle(ink)
            }
            .padding(.horizontal, 5)
            .padding(.vertical, 3)
            .background(
                RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous)
                    .fill(isTurn
                        ? highlight.opacity(0.72 + 0.23 * pulse)
                        : Color.white.opacity(0.35))
            )
            .scaleEffect(1.0 + 0.03 * pulse)
            .frame(maxWidth: .infinity)
        }
        .accessibilityLabel("\(player.rawValue), \(wins) wins\(isTurn ? ", their turn" : "")")
        .id(player)
    }

    /// 0…1 sine wave; ~1.7s full period.
    private func turnPulseAmount(at date: Date) -> CGFloat {
        let t = date.timeIntervalSinceReferenceDate
        return CGFloat((sin(t * .pi / 0.85) + 1) / 2)
    }
}
