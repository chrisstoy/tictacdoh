import SwiftUI
import WatchKit

struct SetupView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 10) {
            playerButton(.x)
            playerButton(.o)
            Button {
                let options = MatchModel.availableRounds
                let index = options.firstIndex(of: session.match.roundsInMatch) ?? 0
                session.setRounds(options[(index + 1) % options.count])
            } label: {
                Group {
                    if session.match.roundsInMatch == MatchModel.infiniteRounds {
                        WordmarkText("ENDLESS")
                    } else {
                        HStack(spacing: 12) {
                            WordmarkText("\(session.match.roundsInMatch)")
                            WordmarkText("ROUNDS")
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .buttonStyle(.plain)
            .background(rowBackground, in: RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous))
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityLabel("Rounds in match, \(roundsAccessibilityLabel)")
            Button {
                session.startMatch()
            } label: {
                HStack(spacing: 12) {
                    WordmarkText(
                        "START",
                        fill: WatchActionChrome.letter,
                        outline: WatchActionChrome.outline
                    )
                    WordmarkText(
                        "GAME",
                        fill: WatchActionChrome.letter,
                        outline: WatchActionChrome.outline
                    )
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .buttonStyle(.plain)
            .background(WatchActionChrome.fill, in: RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous)
                    .strokeBorder(WatchActionChrome.outline, lineWidth: 2)
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityLabel("Start match")
        }
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var roundsAccessibilityLabel: String {
        if session.match.roundsInMatch == MatchModel.infiniteRounds {
            return "Endless"
        }
        return "\(session.match.roundsInMatch) Rounds"
    }

    private func playerButton(_ player: Player) -> some View {
        let cpu = session.isCPU(player)
        let role = cpu ? "CLANKER" : "MEATBAG"
        return Button {
            session.setCPU(player, !cpu)
        } label: {
            HStack(spacing: 6) {
                MarkCanvas(name: player == .x ? "MarkX" : "MarkO")
                    .frame(width: 22, height: 22)
                WordmarkText(role)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .buttonStyle(.plain)
        .background(rowBackground, in: RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous))
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityLabel("\(player.rawValue), \(cpu ? "Clanker" : "Meatbag")")
    }

    private var rowBackground: Color {
        Color.white.opacity(0.5)
    }

    private var background: Color {
        Color(red: AppColor.backgroundRed, green: AppColor.backgroundGreen, blue: AppColor.backgroundBlue)
    }
}

/// Accent action chrome sampled from `assets/start-game.png` (Start Game / Next Round).
enum WatchActionChrome {
    static let fill = Color(red: 245 / 255, green: 155 / 255, blue: 63 / 255)
    static let letter = Color(red: 232 / 255, green: 106 / 255, blue: 42 / 255)
    static let outline = Color(red: 81 / 255, green: 32 / 255, blue: 11 / 255)
}

/// Shared corner radius for tiles, board, pills, and action buttons.
enum WatchLayout {
    static let cornerRadius: CGFloat = 8

    /// SE/Series 40mm-class faces (~197pt tall).
    static var isCompactWatch: Bool {
        WKInterfaceDevice.current().screenBounds.height < 210
    }

    /// Default `WordmarkText` size — a touch smaller on 40mm so labels breathe.
    static var wordmarkSize: CGFloat {
        isCompactWatch ? 20 : 23
    }
}

/// Heavy rounded orange label with a thick dark outline (setup roles, rounds, Start Game).
struct WordmarkText: View {
    var text: String
    var size: CGFloat
    var fill: Color
    var outline: Color

    init(
        _ text: String,
        size: CGFloat = WatchLayout.wordmarkSize,
        fill: Color = Color(red: 240 / 255, green: 160 / 255, blue: 24 / 255),
        outline: Color = Color(red: 80 / 255, green: 40 / 255, blue: 16 / 255)
    ) {
        self.text = text
        self.size = size
        self.fill = fill
        self.outline = outline
    }

    /// Thick enough to read as the wordmark stroke, not a soft shadow.
    private let outlineWidth: CGFloat = 2.0

    var body: some View {
        let font = Font.system(size: size, weight: .black, design: .rounded)
        ZStack {
            ForEach(Array(outlineOffsets.enumerated()), id: \.offset) { _, point in
                Text(text)
                    .font(font)
                    .foregroundStyle(outline)
                    .offset(x: point.x, y: point.y)
            }
            Text(text)
                .font(font)
                .foregroundStyle(fill)
        }
        .accessibilityHidden(true)
    }

    private var outlineOffsets: [CGPoint] {
        let w = outlineWidth
        // 8-way + diagonals at half step for a solid ring.
        var points: [CGPoint] = []
        for dx in stride(from: -w, through: w, by: w / 2) {
            for dy in stride(from: -w, through: w, by: w / 2) {
                if dx == 0 && dy == 0 { continue }
                if hypot(dx, dy) <= w + 0.01 {
                    points.append(CGPoint(x: dx, y: dy))
                }
            }
        }
        return points
    }
}
