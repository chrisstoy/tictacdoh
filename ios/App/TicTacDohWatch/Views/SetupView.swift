import SwiftUI

struct SetupView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 6) {
            playerButton(.x)
            playerButton(.o)
            Button(roundsLabel) {
                let options = MatchModel.availableRounds
                let index = options.firstIndex(of: session.match.roundsInMatch) ?? 0
                session.setRounds(options[(index + 1) % options.count])
            }
            .buttonStyle(.bordered)
            .tint(Color.white.opacity(0.55))
            .foregroundStyle(ink)
            .frame(maxWidth: .infinity, minHeight: 44)
            .accessibilityLabel("Rounds in match, \(roundsLabel)")
            Button("Start") {
                session.startMatch()
            }
            .buttonStyle(.bordered)
            .tint(Color.white.opacity(0.55))
            .foregroundStyle(ink)
            .frame(maxWidth: .infinity, minHeight: 44)
            .accessibilityLabel("Start match")
        }
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var roundsLabel: String {
        if session.match.roundsInMatch == MatchModel.infiniteRounds {
            return "Endless"
        }
        return "\(session.match.roundsInMatch) rounds"
    }

    private func playerButton(_ player: Player) -> some View {
        let cpu = session.isCPU(player)
        return Button(cpu ? "\(player.rawValue) CPU" : "\(player.rawValue) Human") {
            session.setCPU(player, !cpu)
        }
        .buttonStyle(.bordered)
        .tint(Color.white.opacity(0.55))
        .foregroundStyle(ink)
        .frame(maxWidth: .infinity, minHeight: 44)
        .accessibilityLabel("\(player.rawValue), \(cpu ? "CPU" : "human")")
    }

    private var background: Color {
        Color(red: AppColor.backgroundRed, green: AppColor.backgroundGreen, blue: AppColor.backgroundBlue)
    }

    private var ink: Color {
        Color(red: 0.169, green: 0.149, blue: 0.173)
    }
}
