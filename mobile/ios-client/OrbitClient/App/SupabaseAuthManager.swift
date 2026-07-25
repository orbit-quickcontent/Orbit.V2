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
    
    public func signUp(email: String, pass: String, fullName: String) async throws {
        let authResponse = try await client.auth.signUp(
            email: email,
            password: pass,
            data: ["full_name": .string(fullName)]
        )
        await MainActor.run {
            self.currentUserId = authResponse.user.id
            self.isAuthenticated = true
        }
    }
    
    public func signInWithEmail(email: String, pass: String) async throws {
        let session = try await client.auth.signIn(email: email, password: pass)
        await MainActor.run {
            self.currentUserId = session.user.id
            self.isAuthenticated = true
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
