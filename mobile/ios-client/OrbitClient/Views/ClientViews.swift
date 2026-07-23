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
                .background(enabled ? Theme.orbitGradient : LinearGradient(gradient: Gradient(colors: [Color.gray, Color.gray]), startPoint: .leading, endPoint: .trailing))
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

// ─── Screen 1: Login & OTP Verification ──────────────────────────────────────

struct LoginView: View {
    let onLoginSuccess: (String) -> Void
    @State private var emailOrPhone = ""
    @State private var otp = ""
    @State private var step = 1 // 1: Send OTP, 2: Verify OTP
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    @State private var timerSeconds = 30
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 40)
                
                // Brand Header Logo
                ZStack {
                    Circle()
                        .fill(Theme.orbitGradient)
                        .frame(width: 64, height: 64)
                    Text("O")
                        .font(.system(size: 32, weight: .black))
                        .foregroundColor(.white)
                }
                
                VStack(spacing: 4) {
                    Text("ORBIT")
                        .font(.system(size: 36, weight: .black))
                        .foregroundColor(Theme.orbitCyan)
                        .tracking(6)
                    Text("Cinematic UGC & Event Shoots")
                        .font(.subheadline)
                        .foregroundColor(Theme.secondaryText)
                }
                
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(Theme.destructive)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Theme.destructive.opacity(0.15))
                        .cornerRadius(8)
                }
                
                VStack(alignment: .leading, spacing: 16) {
                    if step == 1 {
                        Text("Client Sign In")
                            .font(.title3)
                            .bold()
                            .foregroundColor(.white)
                        Text("Enter your email or phone number to receive a secure OTP")
                            .font(.caption)
                            .foregroundColor(Theme.secondaryText)
                        
                        TextField("Email or Mobile Number", text: $emailOrPhone)
                            .padding()
                            .background(Theme.background)
                            .cornerRadius(10)
                            .foregroundColor(.white)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                        
                        GradientButton(text: isLoading ? "Sending OTP..." : "Send Security OTP", onClick: {
                            if emailOrPhone.isEmpty {
                                errorMessage = "Please enter your email or phone number."
                                return
                            }
                            step = 2
                        }, enabled: !isLoading)
                    } else {
                        Text("Verify Security OTP")
                            .font(.title3)
                            .bold()
                            .foregroundColor(.white)
                        Text("One-Time Code sent to \(emailOrPhone)")
                            .font(.caption)
                            .foregroundColor(Theme.secondaryText)
                        
                        TextField("6-Digit OTP Code", text: $otp)
                            .padding()
                            .background(Theme.background)
                            .cornerRadius(10)
                            .foregroundColor(.white)
                            .keyboardType(.numberPad)
                        
                        GradientButton(text: isLoading ? "Verifying..." : "Verify & Sign In", onClick: {
                            if otp.count < 4 {
                                errorMessage = "Please enter a valid OTP code."
                                return
                            }
                            onLoginSuccess("ios_client_token_\(Date().timeIntervalSince1970)")
                        }, enabled: !isLoading)
                        
                        HStack {
                            Button("← Back") {
                                step = 1
                            }
                            .font(.caption)
                            .foregroundColor(Theme.orbitCyan)
                            
                            Spacer()
                            
                            Text(timerSeconds > 0 ? "Resend in \(timerSeconds)s" : "Resend OTP")
                                .font(.caption)
                                .foregroundColor(timerSeconds == 0 ? Theme.orbitCyan : Theme.secondaryText)
                                .onTapGesture {
                                    if timerSeconds == 0 { timerSeconds = 30 }
                                }
                        }
                        .padding(.top, 8)
                    }
                }
                .glassCardStyle()
                
                Spacer()
            }
            .padding(24)
        }
        .orbitBackground()
        .onReceive(timer) { _ in
            if step == 2 && timerSeconds > 0 {
                timerSeconds -= 1
            }
        }
    }
}

// ─── Screen 2: Dashboard Home ────────────────────────────────────────────────

struct DashboardHomeView: View {
    let onNavigateToBooking: () -> Void
    let onNavigateToPackages: () -> Void
    let onNavigateToTracking: (String) -> Void
    let onNavigateToProfile: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Greeting Navbar Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Good Morning,")
                            .font(.caption)
                            .foregroundColor(Theme.secondaryText)
                        Text("Creative Studio")
                            .font(.headline)
                            .bold()
                            .foregroundColor(.white)
                    }
                    Spacer()
                    HStack(spacing: 8) {
                        Button(action: onNavigateToProfile) {
                            ZStack {
                                Circle().fill(Theme.cardBackground).frame(width: 36, height: 36)
                                Text("🔔").font(.caption)
                            }
                        }
                        Button(action: onNavigateToProfile) {
                            ZStack {
                                Circle().fill(Theme.orbitGradient).frame(width: 36, height: 36)
                                Text("C").font(.subheadline).bold().foregroundColor(.white)
                            }
                        }
                    }
                }
                
                // Web Brand Editorial Typography Header
                VStack(alignment: .leading, spacing: 0) {
                    Text("Shoot")
                        .font(.system(size: 42, weight: .black))
                        .foregroundColor(.white)
                    Text("In Progress.")
                        .font(.system(size: 42, weight: .regular))
                        .italic()
                        .foregroundColor(Theme.orbitCyan)
                    Text("ORBIT V1.0.4 — PREMIUM ACCESS")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.white.opacity(0.3))
                        .tracking(2)
                        .padding(.top, 6)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                // 2x2 Quick Actions Grid
                VStack(spacing: 10) {
                    HStack(spacing: 10) {
                        // Button 1: BOOK NEW SHOOT
                        VStack(alignment: .leading, spacing: 12) {
                            ZStack {
                                Circle().fill(Theme.orbitCyan).frame(width: 28, height: 28)
                                Text("+").font(.headline).bold().foregroundColor(.black)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("BOOK NEW SHOOT").font(.system(size: 11, weight: .black)).foregroundColor(.white)
                                Text("INSTANT MATCHING").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.secondaryText)
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .frame(height: 86)
                        .glassCardStyle()
                        .onTapGesture { onNavigateToBooking() }
                        
                        // Button 2: TRACK ORDER
                        VStack(alignment: .leading, spacing: 12) {
                            ZStack {
                                Circle().fill(Theme.orbitPurple).frame(width: 28, height: 28)
                                Text("DNA").font(.system(size: 8, weight: .black)).foregroundColor(.white)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("TRACK ORDER").font(.system(size: 11, weight: .black)).foregroundColor(.white)
                                Text("1 ACTIVE").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.orbitCyan)
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .frame(height: 86)
                        .glassCardStyle()
                        .onTapGesture { onNavigateToTracking("bk_active_901") }
                    }
                    
                    HStack(spacing: 10) {
                        // Button 3: RECENT PROJECTS
                        VStack(alignment: .leading, spacing: 12) {
                            ZStack {
                                Circle().fill(Color.white.opacity(0.1)).frame(width: 28, height: 28)
                                Text("🎬").font(.caption)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("RECENT PROJECTS").font(.system(size: 11, weight: .black)).foregroundColor(.white)
                                Text("3 DELIVERED").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.secondaryText)
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .frame(height: 86)
                        .glassCardStyle()
                        .onTapGesture { onNavigateToPackages() }
                        
                        // Button 4: BRAND IDENTITY
                        VStack(alignment: .leading, spacing: 12) {
                            ZStack {
                                Circle().fill(Color.white.opacity(0.1)).frame(width: 28, height: 28)
                                Text("⭐").font(.caption)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("BRAND IDENTITY").font(.system(size: 11, weight: .black)).foregroundColor(.white)
                                Text("ASSETS & DNA").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.secondaryText)
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .frame(height: 86)
                        .glassCardStyle()
                        .onTapGesture { onNavigateToPackages() }
                    }
                }
                
                // Active Shoot Live Status
                VStack(alignment: .leading, spacing: 12) {
                    Text("Active Shoot Tracker")
                        .font(.headline)
                        .bold()
                        .foregroundColor(.white)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("UGC Brand Reel Shoot")
                                    .font(.subheadline)
                                    .bold()
                                    .foregroundColor(.white)
                                Text("Booking ID: bk_active_901")
                                    .font(.caption)
                                    .foregroundColor(Theme.secondaryText)
                            }
                            Spacer()
                            Text("SHOOTING")
                                .font(.caption2)
                                .bold()
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Theme.orbitCyan.opacity(0.2))
                                .foregroundColor(Theme.orbitCyan)
                                .cornerRadius(12)
                        }
                        
                        ProgressView(value: 0.45)
                            .tint(Theme.orbitCyan)
                            .background(Theme.border)
                        
                        HStack {
                            Text("Assigned: Alex Rivera")
                                .font(.caption)
                                .foregroundColor(Theme.secondaryText)
                            Spacer()
                            Text("Track Live →")
                                .font(.caption)
                                .bold()
                                .foregroundColor(Theme.orbitCyan)
                        }
                    }
                    .glassCardStyle()
                    .onTapGesture {
                        onNavigateToTracking("bk_active_901")
                    }
                }
                
                // Packages Preview Horizontal Row
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Production Tiers")
                            .font(.headline)
                            .bold()
                            .foregroundColor(.white)
                        Spacer()
                        Button("View All →", action: onNavigateToPackages)
                            .font(.caption)
                            .foregroundColor(Theme.orbitCyan)
                    }
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Personalized")
                                    .font(.headline)
                                    .bold()
                                Text("Cinematic event reels & edits")
                                    .font(.caption)
                                    .foregroundColor(Theme.secondaryText)
                                Text("₹1,999")
                                    .font(.title2)
                                    .bold()
                                    .foregroundColor(Theme.orbitCyan)
                                
                                GradientButton(text: "Select Tier", onClick: onNavigateToBooking)
                            }
                            .frame(width: 220)
                            .glassCardStyle()
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("UGC Professional")
                                    .font(.headline)
                                    .bold()
                                Text("Dedicated editor & Brand DNA")
                                    .font(.caption)
                                    .foregroundColor(Theme.secondaryText)
                                Text("₹4,999")
                                    .font(.title2)
                                    .bold()
                                    .foregroundColor(Theme.orbitPurple)
                                
                                GradientButton(text: "Select Tier", onClick: onNavigateToBooking)
                            }
                            .frame(width: 220)
                            .glassCardStyle()
                        }
                    }
                }
            }
            .padding(16)
        }
        .orbitBackground()
    }
}

// ─── Screen 3: Packages Catalog ──────────────────────────────────────────────

struct PackagesView: View {
    let onSelectPackage: (String) -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                OrbitHeader(title: "Video Packages", subtitle: "Select your production tier")
                
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Personalized Tier")
                            .font(.title3)
                            .bold()
                        Spacer()
                        Text("₹1,999")
                            .font(.title2)
                            .bold()
                            .foregroundColor(Theme.orbitCyan)
                    }
                    Text("Ideal for solo creators & small events")
                        .font(.caption)
                        .foregroundColor(Theme.secondaryText)
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("✓ 1 Finished Vertical Reel (9:16)").font(.subheadline)
                        Text("✓ 60 Minutes On-Site Shooting").font(.subheadline)
                        Text("✓ 24-Hour Express Delivery").font(.subheadline)
                    }
                    .padding(.vertical, 8)
                    
                    GradientButton(text: "Book Package", onClick: { onSelectPackage("pkg-personalized") })
                }
                .glassCardStyle()
                
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("UGC Professional")
                            .font(.title3)
                            .bold()
                        Spacer()
                        Text("₹4,999")
                            .font(.title2)
                            .bold()
                            .foregroundColor(Theme.orbitPurple)
                    }
                    Text("Complete brand video suite")
                        .font(.caption)
                        .foregroundColor(Theme.secondaryText)
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("✓ 3 High-Converting Master Reels").font(.subheadline)
                        Text("✓ 2 Hours On-Site Professional Shoot").font(.subheadline)
                        Text("✓ Brand DNA Integration (Font, Logo)").font(.subheadline)
                    }
                    .padding(.vertical, 8)
                    
                    GradientButton(text: "Book Package", onClick: { onSelectPackage("pkg-professional") })
                }
                .glassCardStyle()
            }
            .padding(16)
        }
        .orbitBackground()
    }
}

// ─── Screen 4: Booking Flow ──────────────────────────────────────────────────

struct BookingFlowView: View {
    let packageId: String
    let onBookingComplete: () -> Void
    @State private var date = "2026-08-01"
    @State private var slot = "10:00 AM - 12:00 PM"
    @State private var location = ""
    @State private var notes = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                OrbitHeader(title: "Configure Shoot", subtitle: "Selected Tier: \(packageId.uppercased())")
                
                VStack(alignment: .leading, spacing: 16) {
                    Text("1. Schedule & Address")
                        .font(.headline)
                        .bold()
                    
                    TextField("Date (YYYY-MM-DD)", text: $date)
                        .padding()
                        .background(Theme.background)
                        .cornerRadius(8)
                        .foregroundColor(.white)
                    
                    TextField("Time Slot (e.g. 10:00 AM)", text: $slot)
                        .padding()
                        .background(Theme.background)
                        .cornerRadius(8)
                        .foregroundColor(.white)
                    
                    TextField("Shoot Location Address", text: $location)
                        .padding()
                        .background(Theme.background)
                        .cornerRadius(8)
                        .foregroundColor(.white)
                    
                    TextField("Special Instructions (Optional)", text: $notes)
                        .padding()
                        .background(Theme.background)
                        .cornerRadius(8)
                        .foregroundColor(.white)
                    
                    Spacer().frame(height: 12)
                    
                    GradientButton(text: "Pay & Dispatch Shoot", onClick: onBookingComplete)
                }
                .glassCardStyle()
            }
            .padding(16)
        }
        .orbitBackground()
    }
}

// ─── Screen 5: Tracking Dashboard ──────────────────────────────────────────────

struct TrackingView: View {
    let bookingId: String
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                OrbitHeader(title: "Shoot Status Tracker", subtitle: "Booking ID: \(bookingId)")
                
                VStack(alignment: .leading, spacing: 16) {
                    Text("Booking Status: SHOOTING IN PROGRESS")
                        .font(.headline)
                        .bold()
                        .foregroundColor(Theme.orbitCyan)
                    
                    ProgressView(value: 0.5)
                        .tint(Theme.orbitCyan)
                        .background(Theme.border)
                        .scaleEffect(x: 1, y: 2, anchor: .center)
                    
                    VStack(alignment: .leading, spacing: 10) {
                        Text("✓ Payment Confirmed").foregroundColor(.white)
                        Text("✓ Partner Assigned & Dispatched").foregroundColor(.white)
                        Text("• Camera Recording (Active)").foregroundColor(Theme.orbitCyan).bold()
                        Text("◦ Cloud Video Upload (Pending)").foregroundColor(Theme.secondaryText)
                        Text("◦ Master Reel Delivery (Pending)").foregroundColor(Theme.secondaryText)
                    }
                }
                .glassCardStyle()
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("Assigned Partner")
                        .font(.headline)
                        .bold()
                    
                    HStack {
                        ZStack {
                            Circle()
                                .fill(Theme.orbitPurple)
                                .frame(width: 48, height: 48)
                            Text("AR").bold().foregroundColor(.white)
                        }
                        
                        VStack(alignment: .leading) {
                            Text("Alex Rivera").bold().foregroundColor(.white)
                            Text("Rating: 4.9 ★ • iPhone 15 Pro Max").font(.caption).foregroundColor(Theme.secondaryText)
                        }
                    }
                }
                .glassCardStyle()
            }
            .padding(16)
        }
        .orbitBackground()
    }
}

// ─── Screen 6: Profile & Settings ────────────────────────────────────────────

struct ProfileView: View {
    let onLogout: () -> Void
                    Text("Log Out Session")
                        .font(.headline)
                        .bold()
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Theme.destructive)
                        .cornerRadius(12)
                }
            }
            .glassCardStyle()
            
            Spacer()
        }
        .padding(16)
        .orbitBackground()
    }
}
