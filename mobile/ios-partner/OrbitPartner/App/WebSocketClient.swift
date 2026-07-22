import Foundation

class WebSocketClient: NSObject {
    static let shared = WebSocketClient()
    private var webSocketTask: URLSessionWebSocketTask?
    
    private override init() {}
    
    func connect(token: String, onNewDispatch: @escaping (String, String) -> Void) {
        guard let url = URL(string: "ws://localhost:3001/socket.io/?EIO=4&transport=websocket") else {
            return
        }
        
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        
        receiveMessage(onNewDispatch: onNewDispatch)
    }
    
    private func receiveMessage(onNewDispatch: @escaping (String, String) -> Void) {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleIncomingText(text, onNewDispatch: onNewDispatch)
                case .data(_):
                    break
                @unknown default:
                    break
                }
                self?.receiveMessage(onNewDispatch: onNewDispatch)
            case .failure(let error):
                print("WebSocket receive error: \(error)")
            }
        }
    }
    
    private func handleIncomingText(_ text: String, onNewDispatch: @escaping (String, String) -> Void) {
        if text.contains("dispatchReceived") {
            let bookingId = extractValue(for: "bookingId", in: text) ?? ""
            let location = extractValue(for: "location", in: text) ?? ""
            DispatchQueue.main.async {
                onNewDispatch(bookingId, location)
            }
        }
    }
    
    func sendLocationUpdate(lat: Double, lng: Double, bookingId: String) {
        let payload = "42[\"locationChanged\",{\"latitude\":\(lat),\"longitude\":\(lng),\"bookingId\":\"\(bookingId)\"}]"
        let message = URLSessionWebSocketMessage.string(payload)
        webSocketTask?.send(message) { error in
            if let error = error {
                print("Error sending location: \(error)")
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
        print("Partner WebSocket opened successfully")
    }
}
