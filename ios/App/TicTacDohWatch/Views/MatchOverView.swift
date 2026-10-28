import SwiftUI

struct MatchOverView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 8) {
            Text(banner)
                .font(.headline)
                .multilineTextAlignment(.center)
                .foregroundStyle(Color(red: 0.169, green: 0.149, blue: 0.173))
                .accessibilityLabel(banner)
            Button("New match") {
                session.newMatch()
            }
            .buttonStyle(.bordered)
            .tint(Color.white.opacity(0.55))
            .foregroundStyle(Color(red: 0.169, green: 0.149, blue: 0.173))
            .frame(maxWidth: .infinity, minHeight: 44)
            .accessibilityLabel("New match")
        }
        .padding(.horizontal, 4)
    }

    private var banner: String {
        if let winner = session.match.winner {
            return "\(winner.rawValue) wins the match"
        }
        return "Match draw"
    }
}
