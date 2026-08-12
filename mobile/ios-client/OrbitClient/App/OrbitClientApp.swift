import SwiftUI

@main
struct OrbitClientApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .orbitBackground()
        }
    }
}
