import Foundation
import Supabase

public class SupabaseAuthManager: ObservableObject {
    public static let shared = SupabaseAuthManager()
    
    public let client = SupabaseClient(
        supabaseURL: URL(string: "https://stlwhzryieptzhfvbqbd.supabase.co")!,
        supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bHdoenJ5aWVwdHpoZnZicWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTc0ODEsImV4cCI6MjA2NzA5MzQ4MX0.placeholder"
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
