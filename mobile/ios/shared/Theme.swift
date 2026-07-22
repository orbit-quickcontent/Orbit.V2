import SwiftUI

public struct Theme {
    public static let background = Color.black
    public static let cardBackground = Color(red: 0.04, green: 0.04, blue: 0.04)
    public static let border = Color(red: 0.1, green: 0.1, blue: 0.18)
    
    public static let orbitCyan = Color(red: 0.0, green: 0.75, blue: 1.0) // #00BFFF
    public static let orbitPurple = Color(red: 0.63, green: 0.13, blue: 0.94) // #A020F0
    
    public static let primaryText = Color.white
    public static let secondaryText = Color(red: 0.49, green: 0.72, blue: 0.88) // #7EB8E0
    public static let destructive = Color(red: 1.0, green: 0.27, blue: 0.27) // #FF4444
    
    public static var orbitGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [orbitCyan, orbitPurple]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}
