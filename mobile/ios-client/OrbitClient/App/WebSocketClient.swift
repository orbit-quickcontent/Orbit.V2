import Foundation

class WebSocketClient: NSObject {
    static let shared = WebSocketClient()
    private var webSocketTask: URLSessionWebSocketTask?
    
    private override init() {}
    
    func connect(token: String, onBookingUpdate: @escaping (String, String) -> Void) {
        guard let url = URL(string: "ws://localhost:3001/socket.io/?EIO=4&transport=websocket") else {
            return
        }
        
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        
        receiveMessage(onBookingUpdate: onBookingUpdate)
    }
    
    private func receiveMessage(onBookingUpdate: @escaping (String, String) -> Void) {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleIncomingText(text, onBookingUpdate: onBookingUpdate)
                case .data(_):
                    break
                @unknown default:
                    break
                }
                self?.receiveMessage(onBookingUpdate: onBookingUpdate)
            case .failure(let error):
                print("WebSocket receive error: \(error)")
            }
        }
    }
    
    private func handleIncomingText(_ text: String, onBookingUpdate: @escaping (String, String) -> Void) {
        // Basic parser for WebSocket / Socket.io frames
        if text.contains("bookingUpdated") {
            // Extract bookingId and status
            let bookingId = extractValue(for: "id", in: text) ?? ""
            let status = extractValue(for: "status", in: text) ?? ""
            DispatchQueue.main.async {
                onBookingUpdate(bookingId, status)
            }
        }
    }
    
    private func extractValue(for key: String, in text: String) -> String? {
        guard let regex = try? NSRegularExpression(pattern: "\"\(key)\"\\s*:\\s*\"([^\"]+)\"") else {
            return nil
        }
        let nsString = text as NSString
        let results = regex.matches(in: text, range: NSRange(location: 0, length: nsString.length))
        guard let match = results.first else { return nil }
        return nsString.substring(with: match.range(at: 1))
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
    }
}

extension WebSocketClient: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        print("WebSocket opened successfully")
    }
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        print("WebSocket closed")
    }
}
