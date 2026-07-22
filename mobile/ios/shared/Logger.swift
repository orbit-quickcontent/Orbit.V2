import Foundation

public struct Logger {
    public static func d(_ message: String) {
        print("[DEBUG] [OrbitLogger] \(message)")
    }
    
    public static func i(_ message: String) {
        print("[INFO] [OrbitLogger] \(message)")
    }
    
    public static func e(_ message: String, _ error: Error? = nil) {
        if let error = error {
            print("[ERROR] [OrbitLogger] \(message) - Error: \(error.localizedDescription)")
        } else {
            print("[ERROR] [OrbitLogger] \(message)")
        }
    }
}
