import Foundation
import Supabase

public class SupabaseAuthManager: ObservableObject {
    public static let shared = SupabaseAuthManager()
    
    public let client = SupabaseClient(
        supabaseURL: URL(string: "https://stlwhzryieptzhfvbqbd.supabase.co")!,
        supabaseKey: "sb_publishable_KyB9qOWcwTtO0nn9l-nFjw_rpEx92iT"
    )
    
    @Published public var isAuthenticated: Bool = false
    @Published public var currentUserId: UUID? = nil
    
    private init() {}
    
    public func signUp(email: String, pass: String, fullName: String, phone: String = "") async throws {
        let authResponse = try await client.auth.signUp(
            email: email,
            password: pass,
            data: [
                "full_name": .string(fullName),
                "name": .string(fullName),
                "phone": .string(phone)
            ]
        )
        await syncProfile(userId: authResponse.user.id, email: email, fullName: fullName, phone: phone)
        await MainActor.run {
            self.currentUserId = authResponse.user.id
            self.isAuthenticated = true
        }
    }
    
    public func signInWithEmail(email: String, pass: String) async throws {
        let session = try await client.auth.signIn(email: email, password: pass)
        await syncProfile(userId: session.user.id, email: email, fullName: "Orbit User")
        await MainActor.run {
            self.currentUserId = session.user.id
            self.isAuthenticated = true
        }
    }

    public func syncProfile(userId: UUID, email: String, fullName: String, phone: String = "") async {
        struct ProfilePayload: Encodable {
            let id: String
            let full_name: String
            let name: String
            let email: String
            let phone: String
            let role: String
        }
        let payload = ProfilePayload(
            id: userId.uuidString,
            full_name: fullName,
            name: fullName,
            email: email,
            phone: phone,
            role: "client"
        )
        do {
            try await client.from("profiles").upsert(payload).execute()
        } catch {
            print("Supabase profile sync notice: \(error)")
        }
    }
    
    public func signInWithApple() async throws {
        let session = try await client.auth.signInWithOAuth(provider: .apple)
        await MainActor.run {
            self.currentUserId = session.user.id
            self.isAuthenticated = true
        }
    }
    
    public func signInWithGoogle() async throws {
        let session = try await client.auth.signInWithOAuth(provider: .google)
        await MainActor.run {
            self.currentUserId = session.user.id
            self.isAuthenticated = true
        }
    }
}
