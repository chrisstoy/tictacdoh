import SwiftUI

struct PlayView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 4) {
            if session.playMode == .playing {
                board
            } else if session.playMode == .roundOver {
                RoundOverView(session: session)
            } else if session.playMode == .matchOver {
                MatchOverView(session: session)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background)
        .toolbar(.hidden, for: .navigationBar)
        .safeAreaInset(edge: .top, spacing: 0) {
            HStack {
                Text(scoreTitle)
                    .font(.caption2)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .foregroundStyle(ink)
                Spacer(minLength: 4)
                Button("Quit") {
                    session.quit()
                }
                .buttonStyle(.plain)
                .font(.caption2)
                .foregroundStyle(ink)
                .accessibilityLabel("Quit")
            }
            .padding(.horizontal, 6)
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
            let gap: CGFloat = 4
            let side = min(geo.size.width, geo.size.height)
            let tile = max((side - gap * 2) / 3, 1)
            VStack(spacing: gap) {
                ForEach(0..<3, id: \.self) { row in
                    HStack(spacing: gap) {
                        ForEach(0..<3, id: \.self) { column in
                            let index = row * 3 + column
                            TileView(
                                index: index,
                                tile: session.round.board[index],
                                highlighted: session.round.winner?.line.contains(index) ?? false,
                                enabled: session.playMode == .playing && !session.needsCPUMove && !session.round.isOver
                            ) {
                                session.placeHuman(at: index)
                            }
                            .frame(width: tile, height: tile)
                        }
                    }
                }
            }
            .frame(width: geo.size.width, height: geo.size.height, alignment: .center)
        }
    }

    private var scoreTitle: String {
        let xWins = session.match.roundsWon(by: .x)
        let oWins = session.match.roundsWon(by: .o)
        let cap = session.match.roundsInMatch == MatchModel.infiniteRounds
            ? "∞"
            : "\(session.match.roundsInMatch)"
        let shownRound = session.playMode == .playing
            ? session.match.rounds.count + 1
            : max(session.match.rounds.count, 1)
        return "X \(xWins)–\(oWins) O  \(shownRound)/\(cap)"
    }

    private var background: Color {
        Color(red: AppColor.backgroundRed, green: AppColor.backgroundGreen, blue: AppColor.backgroundBlue)
    }

    private var ink: Color {
        Color(red: 0.169, green: 0.149, blue: 0.173)
    }
}
