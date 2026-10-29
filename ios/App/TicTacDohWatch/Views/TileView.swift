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
    var side: CGFloat
    var highlighted: Bool
    var enabled: Bool
    var action: () -> Void

    private var markSide: CGFloat { max(side * 0.78, 1) }

    /// Empty cells read lighter so legal moves are clearer; filled stay taupe.
    private var tileFill: Color {
        if highlighted {
            // Brighter win-line fill (#e8912e-ish).
            return Color(red: 232 / 255, green: 145 / 255, blue: 46 / 255)
        }
        if tile == .empty {
            return Color(red: 198 / 255, green: 176 / 255, blue: 164 / 255)
        }
        return Color(red: 169 / 255, green: 141 / 255, blue: 127 / 255)
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous)
                .fill(tileFill)
            if highlighted {
                RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous)
                    .strokeBorder(Color(red: 1.0, green: 0.72, blue: 0.28), lineWidth: max(side * 0.08, 2))
            }
            mark
        }
        .frame(width: side, height: side)
        .contentShape(Rectangle())
        .onTapGesture {
            guard enabled else { return }
            action()
        }
        .accessibilityElement()
        .accessibilityLabel(VoiceOverTile.label(index: index, tile: tile))
        .accessibilityAddTraits(enabled ? .isButton : [])
        .accessibilityAction {
            guard enabled else { return }
            action()
        }
    }

    @ViewBuilder
    private var mark: some View {
        switch tile {
        case .empty:
            Color.clear.frame(width: markSide, height: markSide)
        case .x:
            MarkCanvas(name: "MarkX")
                .frame(width: markSide, height: markSide)
        case .o:
            MarkCanvas(name: "MarkO")
                .frame(width: markSide, height: markSide)
        }
    }
}

/// Draws an asset catalog image aspect-fit and centered in a fixed frame.
struct MarkCanvas: View {
    var name: String

    var body: some View {
        Canvas { context, size in
            let image = context.resolve(Image(name))
            let imageSize = image.size
            guard imageSize.width > 0, imageSize.height > 0, size.width > 0, size.height > 0 else {
                return
            }
            let scale = min(size.width / imageSize.width, size.height / imageSize.height)
            let drawn = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
            let origin = CGPoint(
                x: (size.width - drawn.width) / 2,
                y: (size.height - drawn.height) / 2
            )
            context.draw(image, in: CGRect(origin: origin, size: drawn))
        }
    }
}
