import Foundation

public class AuthManager: ObservableObject {
    public static let shared = AuthManager()
    
    @Published public var isAuthenticated: Bool = false
    @Published public var currentToken: String? = nil
    
    private init() {
        checkSession()
    }
    
    public func checkSession() {
        if let tokenData = KeychainHelper.shared.read(key: "user_session_token"),
           let token = String(data: tokenData, encoding: .utf8) {
            self.currentToken = token
            self.isAuthenticated = true
        } else {
            self.isAuthenticated = false
            self.currentToken = nil
        }
    }
    
    public func saveSession(token: String) {
        if let data = token.data(using: .utf8) {
            KeychainHelper.shared.save(key: "user_session_token", data: data)
            self.currentToken = token
            self.isAuthenticated = true
        }
    }
    
    public func logout() {
        KeychainHelper.shared.delete(key: "user_session_token")
        self.currentToken = nil
        self.isAuthenticated = false
    }
}
