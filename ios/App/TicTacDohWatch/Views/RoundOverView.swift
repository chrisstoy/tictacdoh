import SwiftUI

struct RoundOverView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 8) {
            bannerView
                .accessibilityLabel(bannerAccessibilityLabel)
            Button {
                session.nextRound()
            } label: {
                HStack(spacing: 12) {
                    WordmarkText("NEXT", fill: WatchActionChrome.letter, outline: WatchActionChrome.outline)
                    WordmarkText("ROUND", fill: WatchActionChrome.letter, outline: WatchActionChrome.outline)
                }
                .frame(maxWidth: .infinity, minHeight: 44)
            }
            .buttonStyle(.plain)
            .background(WatchActionChrome.fill, in: RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous)
                    .strokeBorder(WatchActionChrome.outline, lineWidth: 2)
            )
            .frame(maxWidth: .infinity, minHeight: 44)
            .accessibilityLabel("Next round")
        }
        .padding(.horizontal, 4)
    }

    @ViewBuilder
    private var bannerView: some View {
        if session.round.isDraw {
            WordmarkText("DRAW")
        } else if let winner = session.round.winner?.player {
            HStack(spacing: 8) {
                MarkCanvas(name: winner == .x ? "MarkX" : "MarkO")
                    .frame(width: 26, height: 26)
                WordmarkText("WINS")
            }
        } else {
            HStack(spacing: 8) {
                WordmarkText("ROUND")
                WordmarkText("OVER")
            }
        }
    }

    private var bannerAccessibilityLabel: String {
        if session.round.isDraw {
            return "Draw"
        }
        if let winner = session.round.winner?.player {
            return "\(winner.rawValue) wins"
        }
        return "Round over"
    }
}
