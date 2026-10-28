import SwiftUI

struct RoundOverView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 8) {
            Text(banner)
                .font(.headline)
                .multilineTextAlignment(.center)
                .foregroundStyle(Color(red: 0.169, green: 0.149, blue: 0.173))
                .accessibilityLabel(banner)
            Button("Next round") {
                session.nextRound()
            }
            .buttonStyle(.bordered)
            .tint(Color.white.opacity(0.55))
            .foregroundStyle(Color(red: 0.169, green: 0.149, blue: 0.173))
            .frame(maxWidth: .infinity, minHeight: 44)
            .accessibilityLabel("Next round")
        }
        .padding(.horizontal, 4)
    }

    private var banner: String {
        if session.round.isDraw {
            return "Draw"
        }
        if let winner = session.round.winner?.player {
            return "\(winner.rawValue) wins"
        }
        return "Round over"
    }
}
