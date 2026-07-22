import Foundation
import UserNotifications

class NotificationHelper {
    static let shared = NotificationHelper()
    
    private init() {}
    
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("APNs authorization granted")
            } else if let error = error {
                print("APNs authorization error: \(error)")
            }
        }
    }
}
