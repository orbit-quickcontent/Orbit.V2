import Foundation

class WebSocketClient: NSObject {
    static let shared = WebSocketClient()
    private var webSocketTask: URLSessionWebSocketTask?
    private var lastLocationTimestamp: TimeInterval = 0
    
    private override init() {}
    
    func connect(token: String, onNewDispatch: @escaping (String, String) -> Void) {
        let wsUrl = ProcessInfo.processInfo.environment["ORBIT_WS_URL"] ?? "https://orbit-v2-mnmc-one.vercel.app"
        let wsEndpoint = wsUrl.replacingOccurrences(of: "https://", with: "wss://").replacingOccurrences(of: "http://", with: "ws://")
        
        guard let url = URL(string: "\(wsEndpoint)/socket.io/?EIO=4&transport=websocket") else {
            return
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())
        webSocketTask = session.webSocketTask(with: request)
        webSocketTask?.resume()
        
        // Handshake: Socket.IO 40 auth
        let authPayload = "40{\"token\":\"\(token)\"}"
        let authMessage = URLSessionWebSocketMessage.string(authPayload)
        webSocketTask?.send(authMessage) { _ in }
        
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
                print("[iOS Partner WS] Receive error: \(error)")
            }
        }
    }
    
    private func handleIncomingText(_ text: String, onNewDispatch: @escaping (String, String) -> Void) {
        // Socket.IO Ping / Pong
        if text == "2" {
            let pong = URLSessionWebSocketMessage.string("3")
            webSocketTask?.send(pong) { _ in }
            return
        }
        
        if text.contains("booking:dispatched") || text.contains("booking_request") || text.contains("booking:offer") {
            let bookingId = extractValue(for: "bookingId", in: text) ?? extractValue(for: "id", in: text) ?? ""
            let location = extractValue(for: "location", in: text) ?? "Client Shoot Location"
            DispatchQueue.main.async {
                onNewDispatch(bookingId, location)
            }
        }
    }
    
    func sendLocationUpdate(lat: Double, lng: Double, partnerId: String, heading: Double? = null, speed: Double? = null) {
        let now = Date().timeIntervalSince1970
        if now - lastLocationTimestamp < 2.5 {
            return // Rate limit 1 update every 2.5 - 3 seconds
        }
        lastLocationTimestamp = now
        
        // Emits Redis GEO event: partner_location
        let payload = "42[\"partner_location\",{\"partnerId\":\"\(partnerId)\",\"lat\":\(lat),\"lng\":\(lng),\"speed\":\(speed ?? 0),\"heading\":\(heading ?? 0),\"timestamp\":\(Int64(now * 1000))}]"
        let message = URLSessionWebSocketMessage.string(payload)
        webSocketTask?.send(message) { error in
            if let error = error {
                print("[iOS Partner WS] Error sending location: \(error)")
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
        print("[iOS Partner WS] Connected successfully to Realtime WebSocket Server")
    }
}
