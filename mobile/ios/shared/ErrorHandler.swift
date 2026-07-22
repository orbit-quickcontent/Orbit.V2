import Foundation

public enum ErrorHandler {
    public static func handle(_ error: Error) -> String {
        print("[OrbitError] \(error.localizedDescription)")
        return error.localizedDescription
    }
}
