import SwiftUI

// ─── Custom UI Reusable Components ───────────────────────────────────────────

struct GradientButton: View {
    let text: String
    let onClick: () -> Void
    var enabled: Bool = true
    
    var body: some View {
        Button(action: onClick) {
            Text(text)
                .font(.headline)
                .bold()
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(enabled ? Theme.orbitGradient : LinearGradient(gradient: Gradient(colors: [Color.gray, Color.darkGray]), startPoint: .leading, endPoint: .trailing))
                .cornerRadius(12)
        }
        .disabled(!enabled)
    }
}

struct OrbitHeader: View {
    let title: String
    var subtitle: String? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.title2)
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

// ─── Screen 1: Partner Login ─────────────────────────────────────────────────

struct PartnerLoginView: View {
    let onLoginSuccess: (String) -> Void
    @State private var emailOrPhone = ""
    @State private var otp = ""
    @State private var step = 1
    @State private var isLoading = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 40)
                
                ZStack {
                    Circle()
                        .fill(LinearGradient(gradient: Gradient(colors: [Theme.orbitPurple, Theme.orbitCyan]), startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 64, height: 64)
                    Text("P")
                        .font(.system(size: 32, weight: .black))
                        .foregroundColor(.white)
                }
                
                VStack(spacing: 4) {
                    Text("ORBIT PARTNER")
                        .font(.system(size: 32, weight: .black))
                        .foregroundColor(Theme.orbitPurple)
                        .tracking(4)
                    Text("Videographer & Creator Portal")
                        .font(.subheadline)
                        .foregroundColor(Theme.secondaryText)
                }
                
                VStack(alignment: .leading, spacing: 16) {
                    if step == 1 {
                        Text("Partner Sign In")
                            .font(.title3)
                            .bold()
                            .foregroundColor(.white)
                        Text("Enter your registered partner mobile number or email")
                            .font(.caption)
                            .foregroundColor(Theme.secondaryText)
                        
                        TextField("Partner Email / Phone", text: $emailOrPhone)
                            .padding()
                            .background(Theme.background)
                            .cornerRadius(10)
                            .foregroundColor(.white)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                        
                        GradientButton(text: "Request Partner OTP", onClick: {
                            if !emailOrPhone.isEmpty { step = 2 }
                        })
                    } else {
                        Text("Verify Partner OTP")
                            .font(.title3)
                            .bold()
                            .foregroundColor(.white)
                        Text("OTP sent to \(emailOrPhone)")
                            .font(.caption)
                            .foregroundColor(Theme.secondaryText)
                        
                        TextField("6-Digit Partner OTP", text: $otp)
                            .padding()
                            .background(Theme.background)
                            .cornerRadius(10)
                            .foregroundColor(.white)
                            .keyboardType(.numberPad)
                        
                        GradientButton(text: "Verify & Open Studio", onClick: {
                            onLoginSuccess("partner_token_\(Date().timeIntervalSince1970)")
                        })
                    }
                }
                .glassCardStyle()
                
                Spacer()
            }
            .padding(24)
        }
        .orbitBackground()
    }
}

// ─── Screen 2: Partner Dashboard & Dispatch Alerts ───────────────────────────

struct PartnerDashboardView: View {
    let onAcceptDispatch: (String) -> Void
    let onNavigateToWork: () -> Void
    @State private var isOnline = true
    @State private var activeDispatchId: String? = "booking-dispatch-101"
    @State private var countdownSeconds = 30
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header with Toggle
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Partner Studio")
                            .font(.title2)
                            .bold()
                            .foregroundColor(.white)
                        Text(isOnline ? "🟢 ONLINE - Receiving Dispatches" : "🔴 OFFLINE")
                            .font(.caption)
                            .bold()
                            .foregroundColor(isOnline ? Theme.orbitCyan : Theme.secondaryText)
                    }
                    Spacer()
                    Toggle("", isOn: $isOnline)
                        .toggleStyle(SwitchToggleStyle(tint: Theme.orbitPurple))
                        .labelsHidden()
                }
                
                // Dispatch Alert Card
                if isOnline && activeDispatchId != nil {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text("⚡ NEW SHOOT DISPATCH ALERT")
                                .font(.caption2)
                                .bold()
                                .foregroundColor(Theme.orbitPurple)
                                .tracking(1)
                            Spacer()
                            Text("\(countdownSeconds)s")
                                .font(.caption)
                                .bold()
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Theme.destructive.opacity(0.2))
                                .foregroundColor(Theme.destructive)
                                .cornerRadius(8)
                        }
                        
                        Text("UGC Brand Reel Shoot - Bandra West")
                            .font(.headline)
                            .bold()
                            .foregroundColor(.white)
                        
                        Text("Payout Fee: ₹1,500.00 • Distance: 2.4 KM away")
                            .font(.subheadline)
                            .bold()
                            .foregroundColor(Theme.orbitCyan)
                        
                        HStack(spacing: 12) {
                            Button(action: { activeDispatchId = nil }) {
                                Text("Decline")
                                    .bold()
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                                    .background(Color.gray)
                                    .cornerRadius(10)
                            }
                            
                            Button(action: {
                                onAcceptDispatch(activeDispatchId!)
                                onNavigateToWork()
                            }) {
                                Text("Accept Shoot ✓")
                                    .bold()
                                    .foregroundColor(.black)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                                    .background(Theme.orbitCyan)
                                    .cornerRadius(10)
                            }
                        }
                    }
                    .glassCardStyle()
                }
                
                // Daily Performance Stats
                VStack(alignment: .leading, spacing: 12) {
                    Text("Today's Performance")
                        .font(.headline)
                        .bold()
                        .foregroundColor(.white)
                    
                    HStack(spacing: 12) {
                        VStack(alignment: .leading) {
                            Text("Today Earnings")
                                .font(.caption)
                                .foregroundColor(Theme.secondaryText)
                            Text("₹4,500")
                                .font(.title2)
                                .bold()
                                .foregroundColor(Theme.orbitCyan)
                        }
                        .glassCardStyle()
                        
                        VStack(alignment: .leading) {
                            Text("Shoots Done")
                                .font(.caption)
                                .foregroundColor(Theme.secondaryText)
                            Text("3")
                                .font(.title2)
                                .bold()
                                .foregroundColor(.white)
                        }
                        .glassCardStyle()
                    }
                }
            }
            .padding(16)
        }
        .orbitBackground()
        .onReceive(timer) { _ in
            if activeDispatchId != nil && countdownSeconds > 0 {
                countdownSeconds -= 1
            } else if countdownSeconds == 0 {
                activeDispatchId = nil
            }
        }
    }
}

// ─── Screen 3: Map Navigation & Actions ──────────────────────────────────────

struct MapNavigationView: View {
    let onStartShooting: () -> Void
    
    var body: some View {
        VStack {
            OrbitHeader(title: "En Route to Location", subtitle: "Destination: Bandra West, Plot 42, Mumbai")
            
            ZStack {
                Rectangle()
                    .fill(Theme.cardBackground)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.border, lineWidth: 1))
                
                VStack(spacing: 8) {
                    Text("🗺️ MapKit Native Navigation")
                        .font(.headline)
                        .bold()
                        .foregroundColor(Theme.orbitCyan)
                    Text("Route simulation to client shoot location")
                        .font(.caption)
                        .foregroundColor(Theme.secondaryText)
                }
            }
            .frame(maxHeight: .infinity)
            
            Spacer().frame(height: 16)
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Client: Creative Brand Studio").bold().foregroundColor(.white)
                Text("Address: Bandra West, Hill Road, Near Metro Gate 2").font(.caption).foregroundColor(Theme.secondaryText)
                
                GradientButton(text: "Arrived at Location & Start Shoot →", onClick: onStartShooting)
            }
            .glassCardStyle()
        }
        .padding(16)
        .orbitBackground()
    }
}

// ─── Screen 4: Camera (AVFoundation Preview) ─────────────────────────────────

struct CameraView: View {
    let onCompleteShoot: () -> Void
    @State private var isRecording = false
    @State private var clipCount = 3
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack {
                HStack {
                    Text("Clips Recorded: \(clipCount)/10")
                        .font(.caption)
                        .bold()
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.6))
                        .foregroundColor(Theme.orbitCyan)
                        .cornerRadius(20)
                    Spacer()
                }
                .padding(24)
                
                Spacer()
                
                Text("AVFoundation Viewfinder (1080p 60fps)")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                
                Spacer()
                
                VStack(spacing: 20) {
                    Button(action: {
                        isRecording.toggle()
                        if !isRecording { clipCount += 1 }
                    }) {
                        Circle()
                            .fill(isRecording ? Theme.destructive : Color.white)
                            .frame(width: 72, height: 72)
                    }
                    
                    if clipCount > 0 {
                        GradientButton(text: "Finish Shoot & Sync Footage →", onClick: onCompleteShoot)
                    }
                }
                .padding(24)
            }
        }
    }
}

// ─── Screen 5: Video Sync Upload Progress ────────────────────────────────────

struct VideoSyncView: View {
    let onSyncFinish: () -> Void
    @State private var progress: Double = 0.0
    let timer = Timer.publish(every: 0.15, on: .main, in: .common).autoconnect()
    
    var body: some View {
        VStack(spacing: 24) {
            Text("Uploading Raw Shoot Clips")
                .font(.title2)
                .bold()
                .foregroundColor(.white)
            Text("Resumable multipart upload to Orbit S3 Storage")
                .font(.caption)
                .foregroundColor(Theme.secondaryText)
            
            ProgressView(value: progress)
                .tint(Theme.orbitPurple)
                .background(Theme.border)
                .scaleEffect(x: 1, y: 3, anchor: .center)
            
            Text("\(Int(progress * 100))% Uploaded (14.2 MB/s)")
                .font(.headline)
                .bold()
                .foregroundColor(Theme.orbitCyan)
            Text("DO NOT close app during sync")
                .font(.caption2)
                .foregroundColor(Theme.secondaryText)
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

// ─── Screen 6: Partner Profile & Verification ────────────────────────────────

struct PartnerProfileView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                OrbitHeader(title: "Partner Portfolio", subtitle: "Verification status & device settings")
                
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Alex Rivera")
                                .font(.title3)
                                .bold()
                                .foregroundColor(.white)
                            Text("Verified Orbit Creator")
                                .font(.caption)
                                .foregroundColor(Theme.secondaryText)
                        }
                        Spacer()
                        Text("VERIFIED ✓")
                            .font(.caption2)
                            .bold()
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Theme.orbitCyan.opacity(0.2))
                            .foregroundColor(Theme.orbitCyan)
                            .cornerRadius(20)
                    }
                    
                    Divider().background(Theme.border)
                    
                    Text("Star Rating: 4.9 ★ (84 Shoots Completed)")
                    Text("Primary Gear: iPhone 15 Pro Max + Gimbal")
                    Text("Location Base: Bandra West, Mumbai")
                        .foregroundColor(Theme.secondaryText)
                }
                .glassCardStyle()
            }
            .padding(16)
        }
        .orbitBackground()
    }
}

// ─── Screen 7: Partner Wallet & Payouts ──────────────────────────────────────

struct PartnerWalletView: View {
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
