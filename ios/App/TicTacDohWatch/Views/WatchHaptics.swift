import WatchKit

enum WatchHaptics {
    static func play(_ kind: FeedbackKind) {
        let device = WKInterfaceDevice.current()
        switch kind {
        case .place:
            device.play(.click)
        case .win:
            device.play(.success)
        case .lose:
            device.play(.failure)
        case .draw:
            device.play(.retry)
        }
    }
}
