import SwiftUI

struct MatchOverView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 8) {
            bannerView
                .accessibilityLabel(bannerAccessibilityLabel)
            Button {
                session.newMatch()
            } label: {
                HStack(spacing: 12) {
                    WordmarkText("NEW", fill: WatchActionChrome.letter, outline: WatchActionChrome.outline)
                    WordmarkText("MATCH", fill: WatchActionChrome.letter, outline: WatchActionChrome.outline)
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
            .accessibilityLabel("New match")
        }
        .padding(.horizontal, 4)
    }

    @ViewBuilder
    private var bannerView: some View {
        if let winner = session.match.winner {
            VStack(spacing: 1) {
                HStack(spacing: 5) {
                    MarkCanvas(name: winner == .x ? "MarkX" : "MarkO")
                        .frame(width: 20, height: 20)
                    WordmarkText("WINS", size: 14)
                }
                HStack(spacing: 6) {
                    WordmarkText("THE", size: 13)
                    WordmarkText("MATCH", size: 13)
                }
            }
        } else {
            HStack(spacing: 8) {
                WordmarkText("MATCH", size: 16)
                WordmarkText("DRAW", size: 16)
            }
        }
    }

    private var bannerAccessibilityLabel: String {
        if let winner = session.match.winner {
            return "\(winner.rawValue) wins the match"
        }
        return "Match draw"
    }
}
