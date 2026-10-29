import CoreGraphics

/// Layout helpers for `assets/board.png` (803×814).
enum BoardArt {
    static let imageWidth: CGFloat = 803
    static let imageHeight: CGFloat = 814
    static var aspectRatio: CGFloat { imageWidth / imageHeight }

    /// Inset from the board image edge to the playable grid, as a fraction of
    /// width/height. Clears the thick outer frame so equal thirds land in cells.
    static let playInset: CGFloat = 0.095

    static func fittedSize(in bounds: CGSize) -> CGSize {
        let boundsAspect = bounds.width / max(bounds.height, 1)
        if boundsAspect > aspectRatio {
            let height = bounds.height
            return CGSize(width: height * aspectRatio, height: height)
        }
        let width = bounds.width
        return CGSize(width: width, height: width / aspectRatio)
    }

    /// Equal-third cell for index 0…8 inside the inset play area.
    static func cellRect(index: Int, in boardSize: CGSize) -> CGRect {
        let insetX = playInset * boardSize.width
        let insetY = playInset * boardSize.height
        let innerWidth = boardSize.width - insetX * 2
        let innerHeight = boardSize.height - insetY * 2
        let column = CGFloat(index % 3)
        let row = CGFloat(index / 3)
        let tileWidth = innerWidth / 3
        let tileHeight = innerHeight / 3
        return CGRect(
            x: insetX + column * tileWidth,
            y: insetY + row * tileHeight,
            width: tileWidth,
            height: tileHeight
        )
    }
}
