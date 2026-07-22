import SwiftUI

// ─── Custom UI Reusable Components ───────────────────────────────────────────

struct GradientButton: View {
    let text: String
    let onClick: () -> Void
    
    var body: some View {
        Button(action: onClick) {
            Text(text)
                .font(.headline)
                .bold()
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Theme.orbitGradient)
                .cornerRadius(12)
        }
    }
}

struct OrbitHeader: View {
    let title: String
    var subtitle: String? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.title)
                .bold()
                .foregroundColor(.white)
            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundColor(Theme.secondaryText)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 16)
    }
}

// ─── Screen: Partner Dashboard ───────────────────────────────────────────────

struct PartnerDashboardView: View {
    let onAcceptDispatch: (String) -> Void
    let onNavigateToWork: () -> Void
    @State private var isOnline = true
    @State private var activeDispatchId: String? = "booking-dispatch-1"
    
    var body: some View {
        VStack {
            HStack {
                OrbitHeader(title: "Partner Studio", subtitle: "Manage dispatches & shoots")
                Toggle("", isOn: $isOnline)
                    .toggleStyle(SwitchToggleStyle(tint: Theme.orbitCyan))
                    .frame(width: 60)
            }
            
            Spacer().frame(height: 16)
            
            if isOnline && activeDispatchId != nil {
                Text("NEW DISPATCH REQUEST")
                    .font(.caption)
                    .bold()
                    .foregroundColor(Theme.orbitPurple)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, 8)
                
                VStack(alignment: .leading, spacing: 16) {
                    Text("Client Location: Bandra West, Mumbai")
                        .font(.headline)
                        .bold()
                    Text("Date & Time: 22 July, 12:00 PM")
                        .font(.subheadline)
                        .foregroundColor(Theme.secondaryText)
                    
                    HStack(spacing: 12) {
                        Button(action: { activeDispatchId = nil }) {
                            Text("Decline")
                                .bold()
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(Color.gray)
                                .cornerRadius(12)
                        }
                        
                        Button(action: {
                            onAcceptDispatch(activeDispatchId!)
                            onNavigateToWork()
                        }) {
                            Text("Accept")
                                .bold()
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(Theme.orbitCyan)
                                .cornerRadius(12)
                        }
                    }
                }
                .glassCardStyle()
            } else {
                Spacer()
                Text("Waiting for shoot dispatches...")
                    .foregroundColor(Theme.secondaryText)
                Spacer()
            }
            Spacer()
        }
        .padding(16)
        .orbitBackground()
    }
}

// ─── Screen: Map Navigation & Actions ────────────────────────────────────────

struct MapNavigationView: View {
    let onStartShooting: () -> Void
    
    var body: some View {
        VStack {
            OrbitHeader(title: "En Route to Client", subtitle: "Navigate to shoot location")
            
            ZStack {
                Rectangle()
                    .fill(Theme.cardBackground)
                    .border(Theme.border, width: 1)
                
                Text("Apple Maps / Route Interface")
                    .foregroundColor(Theme.secondaryText)
            }
            .frame(maxHeight: .infinity)
            
            Spacer().frame(height: 16)
            
            GradientButton(text: "Arrived & Start Shooting", onClick: onStartShooting)
        }
        .padding(16)
        .orbitBackground()
    }
}

// ─── Screen: Camera (AVFoundation Preview) ───────────────────────────────────

struct CameraView: View {
    let onCompleteShoot: () -> Void
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            Text("Camera viewfinder")
                .foregroundColor(.white)
            
            VStack {
                Spacer()
                
                Button(action: onCompleteShoot) {
                    Circle()
                        .fill(Theme.destructive)
                        .frame(width: 70, height: 70)
                }
                Text("Record Footage")
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.top, 8)
            }
            .padding(.bottom, 24)
        }
    }
}

// ─── Screen: Video Sync Upload Progress ──────────────────────────────────────

struct VideoSyncView: View {
    let onSyncFinish: () -> Void
    @State private var progress: Double = 0.0
    let timer = Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        VStack(spacing: 24) {
            Text("Uploading Shoot Footage")
                .font(.title2)
                .bold()
            Text("DO NOT close the app during background sync")
                .font(.caption)
                .foregroundColor(Theme.secondaryText)
            
            ProgressView(value: progress)
                .tint(Theme.orbitPurple)
                .background(Theme.border)
                .scaleEffect(x: 1, y: 3, anchor: .center)
            
            Text("\(Int(progress * 100))% Sync Completed")
                .foregroundColor(Theme.orbitCyan)
        }
        .padding(24)
        .orbitBackground()
        .onReceive(timer) { _ in
            if progress < 1.0 {
                progress += 0.05
            } else {
                timer.upstream.connect().cancel()
                onSyncFinish()
            }
        }
    }
}

// ─── Screen: Partner Profile ─────────────────────────────────────────────────

struct PartnerProfileView: View {
    var body: some View {
        VStack {
            OrbitHeader(title: "Partner Portfolio", subtitle: "Verify stats and devices")
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Verification status: VERIFIED")
                    .foregroundColor(Theme.orbitCyan)
                    .bold()
                Divider().background(Theme.border)
                Text("Rating: 4.9 ★")
                Text("Completed Shoots: 48")
                Text("Active device: iPhone 15 Pro Max")
                    .foregroundColor(Theme.secondaryText)
            }
            .glassCardStyle()
            
            Spacer()
        }
        .padding(16)
        .orbitBackground()
    }
}

// ─── Screen: Partner Wallet & Payouts ────────────────────────────────────────

struct PartnerWalletView: View {
    @State private var amount = "5000"
    
    var body: some View {
        VStack {
            OrbitHeader(title: "Earning Center", subtitle: "Track balance and withdraw payouts")
            
            VStack(alignment: .leading) {
                Text("Available Balance")
                    .foregroundColor(Theme.secondaryText)
                Text("₹24,500.00")
                    .font(.system(size: 32, weight: .black))
                Text("Pending clearance: ₹4,000")
                    .font(.caption)
                    .foregroundColor(Theme.secondaryText)
            }
            .glassCardStyle()
            
            Spacer().frame(height: 20)
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Bank Payout")
                    .font(.headline)
                    .bold()
                
                TextField("Withdrawal Amount", text: $amount)
                    .padding()
                    .background(Theme.background)
                    .cornerRadius(8)
                    .foregroundColor(.white)
                
                Spacer().frame(height: 12)
                
                GradientButton(text: "Initiate instant Payout") {}
            }
            .glassCardStyle()
            
            Spacer()
        }
        .padding(16)
        .orbitBackground()
    }
}
