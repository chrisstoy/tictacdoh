import SwiftUI

@main
struct TicTacDohWatchApp: App {
    @StateObject private var session = GameSession()

    var body: some Scene {
        WindowGroup {
            RootView(session: session)
        }
    }
}

struct RootView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        NavigationStack {
            Group {
                switch session.playMode {
                case .splash:
                    SplashView(session: session)
                case .setupMatch:
                    SetupView(session: session)
                default:
                    PlayView(session: session)
                }
            }
            .containerBackground(background, for: .navigation)
        }
        .onChange(of: session.feedback?.token ?? 0) { _, _ in
            guard let kind = session.feedback?.kind else { return }
            WatchHaptics.play(kind)
        }
    }

    private var background: Color {
        Color(red: AppColor.backgroundRed, green: AppColor.backgroundGreen, blue: AppColor.backgroundBlue)
    }
}
