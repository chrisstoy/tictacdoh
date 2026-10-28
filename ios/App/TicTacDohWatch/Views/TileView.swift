import SwiftUI

enum VoiceOverTile {
    static let places = [
        "Top left",
        "Top center",
        "Top right",
        "Middle left",
        "Center",
        "Middle right",
        "Bottom left",
        "Bottom center",
        "Bottom right",
    ]

    static func label(index: Int, tile: Tile) -> String {
        let state: String
        switch tile {
        case .empty:
            state = "empty"
        case .x:
            state = "X"
        case .o:
            state = "O"
        }
        return "\(places[index]), \(state)"
    }
}

struct TileView: View {
    var index: Int
    var tile: Tile
    var highlighted: Bool
    var enabled: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(highlighted ? Color(red: 0.769, green: 0.435, blue: 0.141) : Color.white.opacity(0.45))
                mark
            }
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .accessibilityLabel(VoiceOverTile.label(index: index, tile: tile))
        .accessibilityAddTraits(.isButton)
    }

    @ViewBuilder
    private var mark: some View {
        switch tile {
        case .empty:
            Color.clear
        case .x:
            XMark()
                .foregroundStyle(Color(red: 0.169, green: 0.149, blue: 0.173))
                .padding(6)
        case .o:
            Circle()
                .stroke(Color(red: 0.769, green: 0.435, blue: 0.141), lineWidth: 4)
                .padding(8)
        }
    }
}

private struct XMark: View {
    var body: some View {
        ZStack {
            Capsule().frame(width: 5)
                .rotationEffect(.degrees(45))
            Capsule().frame(width: 5)
                .rotationEffect(.degrees(-45))
        }
    }
}
