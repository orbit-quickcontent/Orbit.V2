import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Orbit Client Native iOS")
                .font(.title)
                .bold()
                .foregroundStyle(Theme.orbitGradient)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background)
    }
}
