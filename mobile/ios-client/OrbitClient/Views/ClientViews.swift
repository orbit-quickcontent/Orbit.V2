import SwiftUI

// ─── Theme & Reusable Design Components ──────────────────────────────────────

struct Theme {
    static let background = Color(red: 19/255, green: 19/255, blue: 19/255)
    static let cardBackground = Color(red: 28/255, green: 27/255, blue: 27/255)
    static let border = Color(red: 60/255, green: 73/255, blue: 78/255)
    static let orbitCyan = Color(red: 71/255, green: 214/255, blue: 255/255)
    static let orbitPurple = Color(red: 160/255, green: 86/255, blue: 255/255)
    static let secondaryText = Color(red: 187/255, green: 201/255, blue: 207/255)
    static let destructive = Color(red: 255/255, green: 180/255, blue: 171/255)
    
    static var orbitGradient: LinearGradient {
        LinearGradient(gradient: Gradient(colors: [orbitCyan, orbitPurple]), startPoint: .leading, endPoint: .trailing)
    }
}

extension View {
    func glassCardStyle(borderColor: Color = Theme.border) -> some View {
        self
            .padding(20)
            .background(Theme.cardBackground)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(borderColor, lineWidth: 1)
            )
    }
    
    func orbitBackground() -> some View {
        self
            .background(Theme.background.ignoresSafeArea())
    }
}

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

struct ClientTopAppBar: View {
    var userName: String = "Test User"
    var userInitials: String = "TU"
    var roleBadge: String = "CREATOR"
    var onProfileClick: () -> Void = {}
    
    var body: some View {
        HStack {
            HStack(spacing: 12) {
                ZStack(alignment: .bottomTrailing) {
                    Circle()
                        .fill(Theme.cardBackground)
                        .frame(width: 40, height: 40)
                        .overlay(Circle().stroke(Theme.border, lineWidth: 1))
                    Text(userInitials)
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(Theme.orbitCyan)
                    
                    Circle()
                        .fill(Color(red: 0, green: 1, blue: 133/255))
                        .frame(width: 10, height: 10)
                        .overlay(Circle().stroke(Theme.background, lineWidth: 2))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text("GOOD AFTERNOON")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Theme.secondaryText)
                            .tracking(1)
                        Text("🎁 \(roleBadge)")
                            .font(.system(size: 8, weight: .black))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Theme.orbitPurple.opacity(0.25))
                            .foregroundColor(Color(red: 228/255, green: 152/255, blue: 1))
                            .cornerRadius(8)
                    }
                    Text("Hi, \(userName)")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Theme.orbitCyan)
                }
            }
            .onTapGesture { onProfileClick() }
            
            Spacer()
            
            HStack(spacing: 12) {
                Text("🔍").font(.system(size: 16))
                ZStack(alignment: .topTrailing) {
                    Text("🔔").font(.system(size: 16))
                    Circle()
                        .fill(Theme.orbitCyan)
                        .frame(width: 8, height: 8)
                }
                Text("▾").font(.system(size: 14)).foregroundColor(.white)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Theme.background)
    }
}

// ─── Screen 1: Login & Onboarding ─────────────────────────────────────────────

struct LoginView: View {
    let onLoginSuccess: (String) -> Void
    @State private var fullName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var selectedPersona = "Creator"
    @State private var avatarMode = "Avatar"
    
    let personas = ["Creator", "Professional", "Artist", "Explorer", "Visionary"]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Spacer().frame(height: 10)
                
                // Brand Header
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(Theme.orbitGradient)
                            .frame(width: 36, height: 36)
                        Text("O")
                            .font(.system(size: 20, weight: .black))
                            .foregroundColor(.white)
                    }
                    Text("ORBIT")
                        .font(.system(size: 24, weight: .black))
                        .foregroundColor(Color(red: 59/255, green: 130/255, blue: 246/255))
                        .tracking(2)
                }
                
                Text("Client Account")
                    .font(.system(size: 12, weight: .semibold))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 4)
                    .background(Color(red: 8/255, green: 51/255, blue: 68/255).opacity(0.4))
                    .foregroundColor(Theme.orbitCyan)
                    .cornerRadius(16)
                
                VStack(spacing: 4) {
                    Text("Join the Orbit")
                        .font(.system(size: 32, weight: .black))
                        .foregroundColor(.white)
                    Text("Sign in or create your account to get started")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.6))
                }
                
                // Social Auth Row
                HStack(spacing: 12) {
                    Button(action: { onLoginSuccess("google_ios_token") }) {
                        Text("G  Google")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(Color.white)
                            .cornerRadius(16)
                    }
                    
                    Button(action: { onLoginSuccess("apple_ios_token") }) {
                        Text("  Apple")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(Color.black)
                            .cornerRadius(16)
                            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(red: 39/255, green: 39/255, blue: 42/255), lineWidth: 1))
                    }
                }
                
                // Divider
                HStack {
                    Rectangle().fill(Color(red: 39/255, green: 39/255, blue: 42/255)).frame(height: 1)
                    Text("OR EMAIL")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(red: 113/255, green: 113/255, blue: 122/255))
                        .tracking(1)
                    Rectangle().fill(Color(red: 39/255, green: 39/255, blue: 42/255)).frame(height: 1)
                }
                .padding(.vertical, 8)
                
                // Persona Selection Container
                VStack(spacing: 16) {
                    Text("CHOOSE YOUR PROFILE PICTURE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(red: 147/255, green: 197/255, blue: 253/255).opacity(0.6))
                        .tracking(1)
                    
                    ZStack {
                        Circle()
                            .fill(Color(red: 39/255, green: 39/255, blue: 42/255))
                            .frame(width: 90, height: 90)
                            .overlay(Circle().stroke(Color(red: 63/255, green: 63/255, blue: 70/255), lineWidth: 4))
                        Text(selectedPersona == "Creator" ? "👨🏻‍🦱" : "👨🏽‍💼")
                            .font(.system(size: 40))
                    }
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(personas, id: \.self) { persona in
                                VStack(spacing: 4) {
                                    ZStack {
                                        Circle().fill(Color(red: 39/255, green: 39/255, blue: 42/255)).frame(width: 44, height: 44)
                                        Text(persona == "Creator" ? "👨🏻‍🦱" : persona == "Professional" ? "👨🏽‍💼" : "👩🏽‍🎨")
                                            .font(.system(size: 20))
                                    }
                                    Text(persona)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(persona == selectedPersona ? .white : Color(red: 113/255, green: 113/255, blue: 122/255))
                                }
                                .padding(8)
                                .background(persona == selectedPersona ? Color(red: 39/255, green: 39/255, blue: 42/255) : Color(red: 24/255, green: 24/255, blue: 27/255))
                                .cornerRadius(16)
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(persona == selectedPersona ? Color(red: 239/255, green: 68/255, blue: 68/255) : Color.clear, lineWidth: 1))
                                .onTapGesture { selectedPersona = persona }
                            }
                        }
                    }
                }
                .glassCardStyle()
                
                // Form Fields Card
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("FULL NAME *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 147/255, green: 197/255, blue: 253/255).opacity(0.6))
                        TextField("Enter your name", text: $fullName)
                            .padding()
                            .background(Color(red: 17/255, green: 17/255, blue: 17/255))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("EMAIL ADDRESS *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 147/255, green: 197/255, blue: 253/255).opacity(0.6))
                        TextField("you@example.com", text: $email)
                            .padding()
                            .background(Color(red: 17/255, green: 17/255, blue: 17/255))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                            .keyboardType(.emailAddress)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("PHONE")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 147/255, green: 197/255, blue: 253/255).opacity(0.6))
                        HStack {
                            Text("+91").bold().foregroundColor(Color(red: 113/255, green: 113/255, blue: 122/255))
                            Rectangle().fill(Color(red: 39/255, green: 39/255, blue: 42/255)).frame(width: 1, height: 20)
                            TextField("10-digit mobile number", text: $phone)
                                .foregroundColor(.white)
                                .keyboardType(.numberPad)
                        }
                        .padding()
                        .background(Color(red: 17/255, green: 17/255, blue: 17/255))
                        .cornerRadius(12)
                    }
                }
                .glassCardStyle()
                
                // Submit Action
                Button(action: { onLoginSuccess("ios_email_token_\(Date().timeIntervalSince1970)") }) {
                    Text("✉  Continue to Verify Email  →")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(red: 161/255, green: 161/255, blue: 170/255))
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Color(red: 9/255, green: 9/255, blue: 11/255))
                        .cornerRadius(16)
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(red: 39/255, green: 39/255, blue: 42/255), lineWidth: 1))
                }
                
                Text("You'll need to verify your email before continuing.")
                    .font(.system(size: 10))
                    .foregroundColor(Color(red: 96/255, green: 165/255, blue: 250/255).opacity(0.4))
            }
            .padding(20)
        }
        .orbitBackground()
    }
}

// ─── Screen 2: Dashboard Home ────────────────────────────────────────────────

struct DashboardHomeView: View {
    let onNavigateToBooking: () -> Void
    let onNavigateToPackages: () -> Void
    let onNavigateToTracking: (String) -> Void
    let onNavigateToProfile: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            ClientTopAppBar(onProfileClick: onNavigateToProfile)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Editorial Typography Banner
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Shoot")
                            .font(.system(size: 36, weight: .black))
                            .foregroundColor(.white)
                        Text("In Progress.")
                            .font(.system(size: 36, weight: .regular))
                            .italic()
                            .foregroundColor(Theme.orbitCyan)
                        Text("ORBIT V1.0.4 — PREMIUM ACCESS")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white.opacity(0.3))
                            .tracking(2)
                            .padding(.top, 6)
                    }
                    
                    // 2x2 Quick Actions Grid
                    VStack(spacing: 10) {
                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 10) {
                                ZStack {
                                    Circle().fill(Theme.orbitCyan).frame(width: 28, height: 28)
                                    Text("+").font(.headline).bold().foregroundColor(.black)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("BOOK NEW SHOOT").font(.system(size: 11, weight: .black)).foregroundColor(.white)
                                    Text("INSTANT MATCHING").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.orbitCyan)
                                }
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .frame(height: 86)
                            .glassCardStyle()
                            .onTapGesture { onNavigateToBooking() }
                            
                            VStack(alignment: .leading, spacing: 10) {
                                ZStack {
                                    Circle().fill(Theme.orbitPurple).frame(width: 28, height: 28)
                                    Text("🌸").font(.caption)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("TRACK ORDER").font(.system(size: 11, weight: .black)).foregroundColor(.white)
                                    Text("1 ACTIVE").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.secondaryText)
                                }
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .frame(height: 86)
                            .glassCardStyle()
                            .onTapGesture { onNavigateToTracking("bk_active_901") }
                        }
                        
                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 10) {
                                ZStack {
                                    Circle().fill(Color.white.opacity(0.1)).frame(width: 28, height: 28)
                                    Text("📄").font(.caption)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("RECENT PROJECTS").font(.system(size: 11, weight: .black)).foregroundColor(.white)
                                    Text("12 DELIVERED").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.secondaryText)
                                }
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .frame(height: 86)
                            .glassCardStyle()
                            .onTapGesture { onNavigateToPackages() }
                            
                            VStack(alignment: .leading, spacing: 10) {
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
                            .onTapGesture { onNavigateToProfile() }
                        }
                    }
                    
                    // Live Shoot Tracker Card
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 6) {
                                Circle().fill(Theme.orbitCyan).frame(width: 8, height: 8)
                                Text("LIVE SHOOT TRACKING")
                                    .font(.system(size: 9, weight: .black))
                                    .foregroundColor(.white)
                            }
                            Text("Personalized in progress")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                            Text("📍 Kartar Mansion, 35, Dr Dadasaheb B...")
                                .font(.system(size: 11))
                                .foregroundColor(Theme.secondaryText)
                        }
                        Spacer()
                        Button("Track →") { onNavigateToTracking("bk_active_901") }
                            .font(.system(size: 12, weight: .bold))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .background(Theme.orbitCyan)
                            .foregroundColor(.black)
                            .cornerRadius(20)
                    }
                    .glassCardStyle(borderColor: Theme.orbitCyan.opacity(0.5))
                    
                    // Delivery Stats Row
                    HStack {
                        Spacer()
                        VStack {
                            Text("60MIN").font(.system(size: 16, weight: .black)).foregroundColor(.white)
                            Text("DELIVERY").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.secondaryText)
                        }
                        Spacer()
                        Rectangle().fill(Color(red: 34/255, green: 34/255, blue: 34/255)).frame(width: 1, height: 24)
                        Spacer()
                        VStack {
                            Text("4K").font(.system(size: 16, weight: .black)).foregroundColor(.white)
                            Text("QUALITY").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.secondaryText)
                        }
                        Spacer()
                        Rectangle().fill(Color(red: 34/255, green: 34/255, blue: 34/255)).frame(width: 1, height: 24)
                        Spacer()
                        VStack {
                            Text("500+").font(.system(size: 16, weight: .black)).foregroundColor(.white)
                            Text("PROJECTS").font(.system(size: 9, weight: .bold)).foregroundColor(Theme.secondaryText)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 16)
                    .background(Color(red: 14/255, green: 14/255, blue: 14/255))
                    .cornerRadius(20)
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color(red: 34/255, green: 34/255, blue: 34/255), lineWidth: 1))
                    
                    // Gradient CTA Banner
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Ready to Create Something Cinematic?")
                            .font(.system(size: 18, weight: .black))
                            .foregroundColor(.white)
                        Text("Professional speed-graded custom reels delivered back inside 60 minutes.")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.9))
                        
                        Button(action: onNavigateToBooking) {
                            Text("⚡  Book a Session")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Color.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding(20)
                    .background(LinearGradient(gradient: Gradient(colors: [Color(red: 110/255, green: 32/255, blue: 140/255), Color(red: 0, green: 210/255, blue: 255/255)]), startPoint: .topLeading, endPoint: .bottomTrailing))
                    .cornerRadius(24)
                }
                .padding(16)
            }
        }
        .orbitBackground()
    }
}

// ─── Screen 3: Packages Selection ─────────────────────────────────────────────

struct PackagesView: View {
    let onSelectPackage: (String) -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            ClientTopAppBar()
            
            ScrollView {
                VStack(spacing: 20) {
                    Text("CHOOSE YOUR PACKAGE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Theme.orbitCyan)
                        .tracking(2)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Theme.cardBackground)
                        .cornerRadius(4)
                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(Theme.orbitCyan.opacity(0.3), lineWidth: 1))
                    
                    VStack(spacing: 8) {
                        Text("The Orbit Edge.")
                            .font(.system(size: 32, weight: .black))
                            .foregroundColor(.white)
                        Text("Select the package that fits your needs. Both include professional express editing delivered in 60-120 minutes.")
                            .font(.system(size: 13))
                            .foregroundColor(Theme.secondaryText)
                            .multilineTextAlignment(.center)
                    }
                    
                    // Card 1: Personalized
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Personalized").font(.title2).bold().foregroundColor(.white)
                            Text("Individual creators, personal events").font(.caption).foregroundColor(Theme.secondaryText)
                        }
                        
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("₹1,999").font(.system(size: 36, weight: .black)).foregroundColor(.white)
                            Text("/session").font(.subheadline).foregroundColor(Theme.secondaryText)
                        }
                        
                        Rectangle().fill(Theme.border.opacity(0.4)).frame(height: 1)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("✓ 1 cinematic reel (30-60 sec)").foregroundColor(Theme.secondaryText)
                            Text("✓ Professional color grading").foregroundColor(Theme.secondaryText)
                            Text("✓ Same-day delivery (60-90 mins)").foregroundColor(Theme.secondaryText)
                        }
                        .font(.system(size: 13))
                        
                        Button(action: { onSelectPackage("pkg-personalized") }) {
                            Text("Book Now")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                        }
                    }
                    .glassCardStyle()
                    
                    // Card 2: Professional (UGC)
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Professional (UGC)").font(.title2).bold().foregroundColor(.white)
                                Text("Brands, businesses, template creators").font(.caption).foregroundColor(Theme.secondaryText)
                            }
                            Spacer()
                            Text("MOST POPULAR")
                                .font(.system(size: 9, weight: .black))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Color(red: 237/255, green: 177/255, blue: 255/255))
                                .foregroundColor(Color(red: 82/255, green: 0, blue: 112/255))
                                .cornerRadius(8)
                        }
                        
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("₹4,999").font(.system(size: 36, weight: .black)).foregroundColor(Theme.orbitCyan)
                            Text("/session").font(.subheadline).foregroundColor(Theme.secondaryText)
                        }
                        
                        Rectangle().fill(Theme.border.opacity(0.4)).frame(height: 1)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("✓ 3 cinematic reels (30-60 sec each)").foregroundColor(Theme.secondaryText)
                            Text("✓ Brand DNA integration (logo, palette, font)").foregroundColor(Theme.secondaryText)
                            Text("✓ Same-day express delivery (90-120 mins)").foregroundColor(Theme.secondaryText)
                        }
                        .font(.system(size: 13))
                        
                        GradientButton(text: "Book Now", onClick: { onSelectPackage("pkg-professional") })
                    }
                    .glassCardStyle(borderColor: Theme.orbitCyan.opacity(0.5))
                }
                .padding(16)
            }
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
        VStack(spacing: 0) {
            ClientTopAppBar()
            
            ScrollView {
                VStack(spacing: 20) {
                    OrbitHeader(title = "Configure Shoot", subtitle = "Selected Tier: \(packageId.uppercased())")
                    
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
        }
        .orbitBackground()
    }
}

// ─── Screen 5: Tracking View ─────────────────────────────────────────────────

struct TrackingView: View {
    let bookingId: String
    
    var body: some View {
        VStack(spacing: 0) {
            ClientTopAppBar()
            
            ScrollView {
                VStack(spacing: 20) {
                    OrbitHeader(title = "Shoot Status Tracker", subtitle = "Booking ID: \(bookingId)")
                    
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
                }
                .padding(16)
            }
        }
        .orbitBackground()
    }
}

// ─── Screen 6: Profile & Account Settings ────────────────────────────────────

struct ProfileView: View {
    let onLogout: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            ClientTopAppBar()
            
            ScrollView {
                VStack(spacing: 20) {
                    // Profile Header Card
                    VStack(spacing: 12) {
                        ZStack(alignment: .bottomTrailing) {
                            Circle()
                                .fill(Theme.orbitGradient)
                                .frame(width: 90, height: 90)
                            Text("TU")
                                .font(.system(size: 36, weight: .black))
                                .foregroundColor(.white)
                            
                            Circle()
                                .fill(Color(red: 0, green: 1, blue: 133/255))
                                .frame(width: 16, height: 16)
                                .overlay(Circle().stroke(Theme.cardBackground, lineWidth: 3))
                        }
                        
                        Text("Test User")
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(.white)
                        
                        HStack(spacing: 8) {
                            Text("🎬 CREATOR")
                                .font(.system(size: 10, weight: .bold))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Theme.orbitCyan.opacity(0.15))
                                .foregroundColor(Theme.orbitCyan)
                                .cornerRadius(16)
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.orbitCyan.opacity(0.3), lineWidth: 1))
                            
                            Text("🎨 Creator Persona")
                                .font(.system(size: 12))
                                .foregroundColor(Theme.secondaryText)
                        }
                        
                        Button(action: {}) {
                            Text("CLIENT MEMBERSHIP")
                                .font(.system(size: 10, weight: .black))
                                .tracking(1)
                                .foregroundColor(Theme.orbitCyan)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.orbitCyan, lineWidth: 1))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .glassCardStyle()
                    
                    // General Information Card
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text("General Information").font(.headline).bold().foregroundColor(.white)
                            Spacer()
                            Text("✏️ Edit").font(.caption).bold().foregroundColor(.white)
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(Color.white.opacity(0.08)).cornerRadius(8)
                        }
                        
                        HStack {
                            Text("Full Name").foregroundColor(Theme.secondaryText).font(.subheadline)
                            Spacer()
                            Text("Test User").bold().foregroundColor(.white).font(.subheadline)
                        }
                        HStack {
                            Text("Email Address").foregroundColor(Theme.secondaryText).font(.subheadline)
                            Spacer()
                            Text("test@example.com").bold().foregroundColor(.white).font(.subheadline)
                        }
                        HStack {
                            Text("Phone Number").foregroundColor(Theme.secondaryText).font(.subheadline)
                            Spacer()
                            Text("+91 9876543210").bold().foregroundColor(.white).font(.subheadline)
                        }
                        HStack {
                            Text("Creative Style Preset:").foregroundColor(Theme.secondaryText).font(.subheadline)
                            Spacer()
                            Text("Creator").bold().foregroundColor(Theme.orbitCyan).font(.subheadline)
                        }
                    }
                    .glassCardStyle()
                    
                    // Settings Menu
                    VStack(spacing: 16) {
                        HStack(spacing: 12) {
                            Text("🛡").font(.title3)
                            VStack(alignment: .leading) {
                                Text("Privacy & Security").bold().foregroundColor(.white).font(.subheadline)
                                Text("Manage credentials & direct permissions").font(.caption).foregroundColor(Theme.secondaryText)
                            }
                            Spacer()
                            Text("›").font(.title3).foregroundColor(Theme.secondaryText)
                        }
                        
                        Rectangle().fill(Theme.border.opacity(0.3)).frame(height: 1)
                        
                        HStack(spacing: 12) {
                            Text("⚙️").font(.title3)
                            VStack(alignment: .leading) {
                                Text("App Settings").bold().foregroundColor(.white).font(.subheadline)
                                Text("Toggle notifications & sound fx").font(.caption).foregroundColor(Theme.secondaryText)
                            }
                            Spacer()
                            Text("›").font(.title3).foregroundColor(Theme.secondaryText)
                        }
                        
                        Rectangle().fill(Theme.border.opacity(0.3)).frame(height: 1)
                        
                        HStack(spacing: 12) {
                            Text("❓").font(.title3)
                            VStack(alignment: .leading) {
                                Text("Help & Support").bold().foregroundColor(.white).font(.subheadline)
                                Text("FAQs & support ticket logs").font(.caption).foregroundColor(Theme.secondaryText)
                            }
                            Spacer()
                            Text("›").font(.title3).foregroundColor(Theme.secondaryText)
                        }
                    }
                    .glassCardStyle()
                    
                    // Log Out Action Button
                    Button(action: onLogout) {
                        HStack(spacing: 8) {
                            Text("🚪").font(.subheadline)
                            Text("Log Out Profile")
                                .font(.subheadline)
                                .bold()
                                .foregroundColor(Theme.destructive)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.destructive.opacity(0.4), lineWidth: 1))
                    }
                }
                .padding(16)
            }
        }
        .orbitBackground()
    }
}
