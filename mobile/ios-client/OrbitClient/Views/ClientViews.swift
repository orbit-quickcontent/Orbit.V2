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

// ─── Screen: Login ───────────────────────────────────────────────────────────

struct LoginView: View {
    let onLoginSuccess: (String) -> Void
    @State private var email = ""
    @State private var otp = ""
    @State private var step = 1 // 1: Send OTP, 2: Verify OTP
    
    var body: some View {
        VStack {
            Spacer()
            
            Text("ORBIT")
                .font(.system(size: 36, weight: .black))
                .foregroundColor(Theme.orbitCyan)
                .tracking(4)
            Text("Cinematic UGC Shoots")
                .font(.subheadline)
                .foregroundColor(Theme.secondaryText)
                .padding(.bottom, 40)
            
            VStack {
                if step == 1 {
                    Text("Welcome Back")
                        .font(.title3)
                        .bold()
                        .padding(.bottom, 4)
                    Text("Enter your email to request OTP")
                        .font(.caption)
                        .foregroundColor(Theme.secondaryText)
                        .padding(.bottom, 16)
                    
                    TextField("Email Address", text: $email)
                        .padding()
                        .background(Theme.background)
                        .cornerRadius(8)
                        .foregroundColor(.white)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    Spacer().frame(height: 16)
                    
                    GradientButton(text: "Send OTP") {
                        step = 2
                    }
                } else {
                    Text("Verify Email")
                        .font(.title3)
                        .bold()
                        .padding(.bottom, 4)
                    Text("OTP sent to \(email)")
                        .font(.caption)
                        .foregroundColor(Theme.secondaryText)
                        .padding(.bottom, 16)
                    
                    TextField("One-Time Password", text: $otp)
                        .padding()
                        .background(Theme.background)
                        .cornerRadius(8)
                        .foregroundColor(.white)
                        .keyboardType(.numberPad)
                    
                    Spacer().frame(height: 16)
                    
                    GradientButton(text: "Submit OTP") {
                        onLoginSuccess("mock_token_123")
                    }
                    
                    Button("Go Back") {
                        step = 1
                    }
                    .font(.caption)
                    .foregroundColor(Theme.secondaryText)
                    .padding(.top, 16)
                }
            }
            .glassCardStyle()
            
            Spacer()
        }
        .padding(24)
        .orbitBackground()
    }
}

// ─── Screen: Dashboard Home ──────────────────────────────────────────────────

struct DashboardHomeView: View {
    let onNavigateToBooking: () -> Void
    
    var body: some View {
        VStack {
            OrbitHeader(title: "Cinematic Dashboard", subtitle: "Your video projects and bookings")
            
            GradientButton(text: "+ New Video Booking", onClick: onNavigateToBooking)
            
            Spacer().frame(height: 20)
            
            Text("Active Shoots")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            ScrollView {
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Cinematic Edit")
                                .font(.headline)
                                .bold()
                            Text("Status: SHOOTING")
                                .font(.caption)
                                .foregroundColor(Theme.orbitCyan)
                        }
                        Spacer()
                        Text("22 July")
                            .font(.subheadline)
                            .foregroundColor(Theme.secondaryText)
                    }
                    .glassCardStyle()
                }
            }
        }
        .padding(16)
        .orbitBackground()
    }
}

// ─── Screen: Packages ────────────────────────────────────────────────────────

struct PackagesView: View {
    let onSelectPackage: (String) -> Void
    
    var body: some View {
        VStack {
            OrbitHeader(title: "Video Packages", subtitle: "Select your production tier")
            
            ScrollView {
                VStack(spacing: 16) {
                    VStack(alignment: .leading) {
                        Text("Personalized")
                            .font(.title2)
                            .bold()
                        Text("Cinematic event reels & edits")
                            .font(.subheadline)
                            .foregroundColor(Theme.secondaryText)
                        Text("₹1,999")
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(Theme.orbitCyan)
                            .padding(.vertical, 12)
                        
                        GradientButton(text: "Book Package") {
                            onSelectPackage("pkg-personalized")
                        }
                    }
                    .glassCardStyle()
                    
                    VStack(alignment: .leading) {
                        Text("Professional (UGC)")
                            .font(.title2)
                            .bold()
                        Text("Includes Chat with Editor & Brand customization")
                            .font(.subheadline)
                            .foregroundColor(Theme.secondaryText)
                        Text("₹4,999")
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(Theme.orbitPurple)
                            .padding(.vertical, 12)
                        
                        GradientButton(text: "Book Package") {
                            onSelectPackage("pkg-professional")
                        }
                    }
                    .glassCardStyle()
                }
            }
        }
        .padding(16)
        .orbitBackground()
    }
}

// ─── Screen: Booking Flow ────────────────────────────────────────────────────

struct BookingFlowView: View {
    let packageId: String
    let onBookingComplete: () -> Void
    @State private var date = ""
    @State private var slot = ""
    @State private var location = ""
    
    var body: some View {
        VStack {
            OrbitHeader(title: "Configure Shoot", subtitle: "Selected Tier: \(packageId)")
            
            VStack(spacing: 12) {
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
                
                Spacer().frame(height: 12)
                
                GradientButton(text: "Pay & Dispatch Shoot", onClick: onBookingComplete)
            }
            .glassCardStyle()
            
            Spacer()
        }
        .padding(16)
        .orbitBackground()
    }
}

// ─── Screen: Tracking Dashboard ──────────────────────────────────────────────

struct TrackingView: View {
    let bookingId: String
    
    var body: some View {
        VStack {
            OrbitHeader(title: "Shoot Status Tracker", subtitle: "Booking ID: \(bookingId)")
            
            VStack(alignment: .leading, spacing: 16) {
                Text("Booking Status: PAID")
                    .font(.headline)
                    .bold()
                
                ProgressView(value: 0.2)
                    .tint(Theme.orbitCyan)
                    .background(Theme.border)
                    .scaleEffect(x: 1, y: 2, anchor: .center)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("• Partner Dispatched: Pending").foregroundColor(Theme.secondaryText)
                    Text("• Camera Sync: Pending").foregroundColor(Theme.secondaryText)
                    Text("• Editor Delivery: Pending").foregroundColor(Theme.secondaryText)
                }
            }
            .glassCardStyle()
            
            Spacer()
        }
        .padding(16)
        .orbitBackground()
    }
}

// ─── Screen: Profile & Settings ──────────────────────────────────────────────

struct ProfileView: View {
    let onLogout: () -> Void
    @State private var name = "Demo Client"
    @State private var phone = "+91 98765 43210"
    @State private var font = "Space Grotesk"
    
    var body: some View {
        VStack {
            OrbitHeader(title: "Brand Profile", subtitle: "Manage brand details & options")
            
            VStack(spacing: 12) {
                TextField("Name", text: $name)
                    .padding()
                    .background(Theme.background)
                    .cornerRadius(8)
                    .foregroundColor(.white)
                
                TextField("Phone Number", text: $phone)
                    .padding()
                    .background(Theme.background)
                    .cornerRadius(8)
                    .foregroundColor(.white)
                
                TextField("Brand Font", text: $font)
                    .padding()
                    .background(Theme.background)
                    .cornerRadius(8)
                    .foregroundColor(.white)
                
                Spacer().frame(height: 24)
                
                Button(action: onLogout) {
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
