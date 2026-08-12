import SwiftUI

struct Theme {
    static let background = Color.black
    static let cardBackground = Color(red: 0.04, green: 0.04, blue: 0.04)
    static let border = Color(red: 0.1, green: 0.1, blue: 0.18)
    
    static let orbitCyan = Color(red: 0.0, green: 0.75, blue: 1.0) // #00BFFF
    static let orbitPurple = Color(red: 0.63, green: 0.13, blue: 0.94) // #A020F0
    
    static let primaryText = Color.white
    static let secondaryText = Color(red: 0.49, green: 0.72, blue: 0.88) // #7EB8E0
    static let destructive = Color(red: 1.0, green: 0.27, blue: 0.27) // #FF4444
    
    static var orbitGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [orbitCyan, orbitPurple]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

extension View {
    func orbitBackground() -> some View {
        self.background(Theme.background)
            .foregroundColor(Theme.primaryText)
    }
    
    func glassCardStyle() -> some View {
        self.padding()
            .background(Theme.cardBackground)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Theme.border, lineWidth: 1)
            )
    }
}
