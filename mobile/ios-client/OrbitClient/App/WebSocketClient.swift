import Foundation

class WebSocketClient: NSObject {
    static let shared = WebSocketClient()
    private var webSocketTask: URLSessionWebSocketTask?
    
    private override init() {}
    
    func connect(
        token: String,
        bookingId: String? = null,
        onBookingUpdate: @escaping (String, String) -> Void,
        onPartnerLocationUpdate: ((String, Double, Double) -> Void)? = nil
    ) {
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
        
        if let bId = bookingId, !bId.isEmpty {
            joinBooking(bookingId: bId)
        }
        
        receiveMessage(onBookingUpdate: onBookingUpdate, onPartnerLocationUpdate: onPartnerLocationUpdate)
    }
    
    private func receiveMessage(
        onBookingUpdate: @escaping (String, String) -> Void,
        onPartnerLocationUpdate: ((String, Double, Double) -> Void)?
    ) {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleIncomingText(text, onBookingUpdate: onBookingUpdate, onPartnerLocationUpdate: onPartnerLocationUpdate)
                case .data(_):
                    break
                @unknown default:
                    break
                }
                self?.receiveMessage(onBookingUpdate: onBookingUpdate, onPartnerLocationUpdate: onPartnerLocationUpdate)
            case .failure(let error):
                print("[iOS Client WS] Receive error: \(error)")
            }
        }
    }
    
    private func handleIncomingText(
        _ text: String,
        onBookingUpdate: @escaping (String, String) -> Void,
        onPartnerLocationUpdate: ((String, Double, Double) -> Void)?
    ) {
        // Socket.IO Ping / Pong
        if text == "2" {
            let pong = URLSessionWebSocketMessage.string("3")
            webSocketTask?.send(pong) { _ in }
            return
        }
        
        // Booking status update
        if text.contains("bookingUpdated") || text.contains("booking:status-update") || text.contains("booking:partner-assigned") {
            let bookingId = extractValue(for: "id", in: text) ?? extractValue(for: "bookingId", in: text) ?? ""
            let status = extractValue(for: "status", in: text) ?? (text.contains("partner-assigned") ? "ACCEPTED" : "UPDATED")
            DispatchQueue.main.async {
                onBookingUpdate(bookingId, status)
            }
        }
        
        // Partner live GPS movement event
        if text.contains("partner_location_update") || text.contains("partner:location") {
            let partnerId = extractValue(for: "partnerId", in: text) ?? ""
            if let latStr = extractNumericValue(for: "lat", in: text) ?? extractNumericValue(for: "latitude", in: text),
               let lngStr = extractNumericValue(for: "lng", in: text) ?? extractNumericValue(for: "longitude", in: text),
               let lat = Double(latStr),
               let lng = Double(lngStr) {
                DispatchQueue.main.async {
                    onPartnerLocationUpdate?(partnerId, lat, lng)
                }
            }
        }
    }
    
    func joinBooking(bookingId: String) {
        let payload = "42[\"join_booking\",\"\(bookingId)\"]"
        let message = URLSessionWebSocketMessage.string(payload)
        webSocketTask?.send(message) { _ in }
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
    
    private func extractNumericValue(for key: String, in text: String) -> String? {
        guard let regex = try? NSRegularExpression(pattern: "\"\(key)\"\\s*:\\s*([0-9.-]+)") else {
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
        print("[iOS Client WS] Connected successfully to Orbit Realtime Server")
    }
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        print("[iOS Client WS] Disconnected")
    }
}
