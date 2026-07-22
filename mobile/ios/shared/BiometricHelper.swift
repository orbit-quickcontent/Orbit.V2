import Foundation
import LocalAuthentication

public class BiometricHelper {
    public static let shared = BiometricHelper()
    
    private init() {}
    
    public func isBiometricAvailable() -> Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }
    
    public func authenticate(reason: String = "Log in to Orbit using Face ID", completion: @escaping (Bool, String?) -> Void) {
        let context = LAContext()
        var error: NSError?
        
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, evalError in
                DispatchQueue.main.async {
                    if success {
                        completion(true, nil)
                    } else {
                        completion(false, evalError?.localizedDescription ?? "Authentication failed")
                    }
                }
            }
        } else {
            completion(false, error?.localizedDescription ?? "Biometrics unavailable")
        }
    }
}
