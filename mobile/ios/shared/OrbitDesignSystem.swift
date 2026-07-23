import SwiftUI

// ─── Orbit Design System Specifications ───────────────────────────────────────

public struct OrbitDesignSystem {
    public static let orbitCyan = Color(red: 0.0, green: 0.75, blue: 1.0)
    public static let orbitPurple = Color(red: 0.63, green: 0.13, blue: 0.94)
    public static let spaceNavy = Color.black
    public static let spaceNavyLight = Color(red: 0.04, green: 0.04, blue: 0.04)
    public static let spaceNavyLighter = Color(red: 0.07, green: 0.07, blue: 0.07)
    public static let orbitBorder = Color(red: 0.10, green: 0.10, blue: 0.18)
    public static let mutedText = Color(red: 0.49, green: 0.72, blue: 0.88)
    public static let destructive = Color(red: 1.0, green: 0.27, blue: 0.27)
    
    public static let orbitGradient = LinearGradient(
        gradient: Gradient(colors: [orbitCyan, orbitPurple]),
        startPoint: .leading,
        endPoint: .trailing
    )
}

// ─── 1. Orbit Custom Buttons ──────────────────────────────────────────────────

public struct OrbitGradientButton: View {
    public let text: String
    public let onClick: () -> Void
    public var enabled: Bool = true
    
    public init(text: String, onClick: @escaping () -> Void, enabled: Bool = true) {
        self.text = text
        self.onClick = onClick
        self.enabled = enabled
    }
    
    public var body: some View {
        Button(action: onClick) {
            Text(text)
                .font(.headline)
                .bold()
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(enabled ? OrbitDesignSystem.orbitGradient : LinearGradient(gradient: Gradient(colors: [Color.gray, Color.darkGray]), startPoint: .leading, endPoint: .trailing))
                .cornerRadius(12)
        }
        .disabled(!enabled)
    }
}

// ─── 2. Orbit Glass Cards ─────────────────────────────────────────────────────

public struct OrbitGlassCard<Content: View>: View {
    public let borderColor: Color
    public let content: () -> Content
    
    public init(borderColor: Color = OrbitDesignSystem.orbitBorder, @ViewBuilder content: @escaping () -> Content) {
        self.borderColor = borderColor
        self.content = content
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            content()
        }
        .padding(20)
        .background(OrbitDesignSystem.spaceNavyLight)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(borderColor, lineWidth: 1))
    }
}

// ─── 3. Orbit Text Fields & Search Bars ───────────────────────────────────────

public struct OrbitInput: View {
    public let label: String
    @Binding public var text: String
    
    public init(label: String, text: Binding<String>) {
        self.label = label
        self._text = text
    }
    
    public var body: some View {
        TextField(label, text: $text)
            .padding()
            .background(OrbitDesignSystem.spaceNavyLighter)
            .cornerRadius(10)
            .foregroundColor(.white)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(OrbitDesignSystem.orbitBorder, lineWidth: 1))
    }
}

public struct OrbitSearchBar: View {
    @Binding public var query: String
    
    public init(query: Binding<String>) {
        self._query = query
    }
    
    public var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(OrbitDesignSystem.orbitCyan)
            TextField("Search Orbit catalog...", text: $query)
                .foregroundColor(.white)
        }
        .padding()
        .background(OrbitDesignSystem.spaceNavyLight)
        .cornerRadius(24)
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(OrbitDesignSystem.orbitBorder, lineWidth: 1))
    }
}

// ─── 4. Orbit Top Bars & Headers ──────────────────────────────────────────────

public struct OrbitTopBar: View {
    public let title: String
    public var subtitle: String? = nil
    
    public init(title: String, subtitle: String? = nil) {
        self.title = title
        self.subtitle = subtitle
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.title2)
                .bold()
                .foregroundColor(.white)
            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundColor(OrbitDesignSystem.mutedText)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 16)
    }
}

// ─── 5. Orbit Specialized Cards ───────────────────────────────────────────────

public struct OrbitPackageCard: View {
    public let title: String
    public let subtitle: String
    public let price: String
    public let features: [String]
    public let onSelect: () -> Void
    public var isPopular: Bool = false
    
    public var body: some View {
        OrbitGlassCard(borderColor: isPopular ? OrbitDesignSystem.orbitPurple : OrbitDesignSystem.orbitBorder) {
            HStack {
                VStack(alignment: .leading) {
                    Text(title)
                        .font(.title3)
                        .bold()
                        .foregroundColor(.white)
                    if isPopular {
                        Text("MOST POPULAR")
                            .font(.caption2)
                            .bold()
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(OrbitDesignSystem.orbitPurple.opacity(0.2))
                            .foregroundColor(OrbitDesignSystem.orbitPurple)
                            .cornerRadius(4)
                    }
                }
                Spacer()
                Text(price)
                    .font(.title2)
                    .bold()
                    .foregroundColor(isPopular ? OrbitDesignSystem.orbitPurple : OrbitDesignSystem.orbitCyan)
            }
            
            Text(subtitle)
                .font(.caption)
                .foregroundColor(OrbitDesignSystem.mutedText)
                .padding(.vertical, 8)
            
            VStack(alignment: .leading, spacing: 6) {
                ForEach(features, id: \.self) { feature in
                    Text("✓ \(feature)")
                        .font(.subheadline)
                        .foregroundColor(.white)
                }
            }
            
            Spacer().frame(height: 12)
            OrbitGradientButton(text: "Book \(title) Package", onClick: onSelect)
        }
    }
}

public struct OrbitStatusTimeline: View {
    public let currentStage: Int
    public let stages: [String]
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(stages.enumerated()), id: \.offset) { index, stage in
                HStack {
                    if index < currentStage {
                        Text("✓").bold().foregroundColor(OrbitDesignSystem.orbitCyan)
                        Text(stage).foregroundColor(.white)
                    } else if index == currentStage {
                        Text("•").bold().foregroundColor(OrbitDesignSystem.orbitCyan)
                        Text("\(stage) (Active)").bold().foregroundColor(OrbitDesignSystem.orbitCyan)
                    } else {
                        Text("◦").foregroundColor(OrbitDesignSystem.mutedText)
                        Text("\(stage) (Pending)").foregroundColor(OrbitDesignSystem.mutedText)
                    }
                }
            }
        }
    }
}

public struct OrbitWalletCard: View {
    public let balance: String
    public let pending: String
    public let onWithdraw: () -> Void
    
    public var body: some View {
        OrbitGlassCard(borderColor: OrbitDesignSystem.orbitCyan) {
            Text("Available Balance")
                .font(.caption)
                .foregroundColor(OrbitDesignSystem.mutedText)
            Text(balance)
                .font(.system(size: 36, weight: .black))
                .foregroundColor(.white)
            Text("Pending Clearance: \(pending)")
                .font(.caption)
                .bold()
                .foregroundColor(OrbitDesignSystem.orbitCyan)
            
            Spacer().frame(height: 12)
            OrbitGradientButton(text: "Initiate Instant Payout", onClick: onWithdraw)
        }
    }
}

public struct OrbitLoader: View {
    public var body: some View {
        ProgressView()
            .tint(OrbitDesignSystem.orbitCyan)
            .scaleEffect(1.5)
    }
}

public struct OrbitSkeleton: View {
    public var body: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(OrbitDesignSystem.spaceNavyLight)
            .frame(height: 100)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(OrbitDesignSystem.orbitBorder, lineWidth: 1))
    }
}
