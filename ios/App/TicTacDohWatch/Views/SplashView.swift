import SwiftUI

struct SplashView: View {
    @ObservedObject var session: GameSession

    var body: some View {
        VStack(spacing: 2) {
            // scaledToFit — entire splash visible, never cropped or covered.
            Image("SplashScreen")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .accessibilityHidden(true)

            Button {
                session.showMenu()
            } label: {
                WordmarkText(
                    "PLAY",
                    size: 15,
                    fill: WatchActionChrome.letter,
                    outline: WatchActionChrome.outline
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .buttonStyle(.plain)
            .frame(width: 100, height: 32)
            .background(WatchActionChrome.fill, in: RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: WatchLayout.cornerRadius, style: .continuous)
                    .strokeBorder(WatchActionChrome.outline, lineWidth: 1.5)
            )
            .accessibilityLabel("Play")
        }
        .padding(.bottom, 4)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var background: Color {
        Color(red: AppColor.backgroundRed, green: AppColor.backgroundGreen, blue: AppColor.backgroundBlue)
    }
}
