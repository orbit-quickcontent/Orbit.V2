import Foundation

/**
 * OrbitAuthManager
 *
 * Authenticates users against the Orbit Express REST backend API over URLSession.
 */
public class OrbitAuthManager: ObservableObject {
    public static let shared = OrbitAuthManager()

    private let baseUrl: String = {
        ProcessInfo.processInfo.environment["ORBIT_API_URL"]
            ?? "https://app.orbit-quickcontent.com/api"
    }()

    @Published public var isAuthenticated: Bool = false
    @Published public var currentUserId: String? = nil
    @Published public var currentToken: String? = nil

    private init() {}

    // MARK: – Helpers

    private func post(endpoint: String, body: [String: Any]) async throws -> [String: Any] {
        guard let url = URL(string: "\(baseUrl)\(endpoint)") else {
            throw URLError(.badURL)
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        req.timeoutInterval = 15

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let httpResp = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }

        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        if httpResp.statusCode >= 400 {
            let msg = json["error"] as? String ?? json["message"] as? String ?? "HTTP \(httpResp.statusCode)"
            throw NSError(domain: "OrbitAuth", code: httpResp.statusCode, userInfo: [NSLocalizedDescriptionKey: msg])
        }
        return json
    }

    private func extractAuth(_ json: [String: Any]) -> (token: String?, userId: String?) {
        let token = json["token"] as? String
            ?? (json["data"] as? [String: Any])?["token"] as? String
        let userId = (json["user"] as? [String: Any])?["id"] as? String
        return (token, userId)
    }

    // MARK: – Public API

    public func signUp(email: String, pass: String, fullName: String, phone: String = "") async throws {
        let json = try await post(endpoint: "/auth/register", body: [
            "email": email,
            "password": pass,
            "name": fullName,
            "phone": phone,
            "role": "CLIENT"
        ])
        let (token, userId) = extractAuth(json)
        await MainActor.run {
            self.currentToken = token
            self.currentUserId = userId
            self.isAuthenticated = userId != nil
        }
    }

    public func signInWithEmail(email: String, pass: String) async throws {
        let json = try await post(endpoint: "/auth/login", body: [
            "email": email,
            "password": pass
        ])
        let (token, userId) = extractAuth(json)
        await MainActor.run {
            self.currentToken = token
            self.currentUserId = userId
            self.isAuthenticated = userId != nil
        }
    }

    public func signInWithGoogle(email: String, fullName: String) async throws {
        let json = try await post(endpoint: "/auth/google", body: [
            "email": email,
            "name": fullName,
            "role": "CLIENT"
        ])
        let (token, userId) = extractAuth(json)
        await MainActor.run {
            self.currentToken = token
            self.currentUserId = userId
            self.isAuthenticated = true
        }
    }

    public func signInWithApple(email: String, fullName: String) async throws {
        // Apple Sign-In: send the resolved email+name to the backend auth/google endpoint.
        // Replace with /auth/apple once the backend adds Apple-specific token verification.
        try await signInWithGoogle(email: email, fullName: fullName)
    }

    public func signOut() {
        Task { @MainActor in
            self.currentToken = nil
            self.currentUserId = nil
            self.isAuthenticated = false
        }
    }
}

// MARK: – Alias for backwards compatibility
public typealias SupabaseAuthManager = OrbitAuthManager
