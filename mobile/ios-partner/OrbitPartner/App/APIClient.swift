import Foundation

enum APIError: Error {
    case invalidURL
    case requestFailed(Error)
    case invalidResponse
    case decodingFailed(Error)
}

struct User: Codable {
    let id: String
    let email: String
    let name: String?
    let phone: String?
    let role: String
    let avatar: String?
}

struct Booking: Codable, Identifiable {
    let id: String
    let status: String
    let bookingDate: String
    let timeSlot: String
    let location: String?
    let notes: String?
    let syncPercentage: Int
    let createdAt: String
}

struct PartnerProfile: Codable, Identifiable {
    let id: String
    let userId: String
    let location: String
    let availability: Bool
    let isVerified: Bool
    let rating: Float
    let completedProjects: Int
    let deviceInfo: String?
    let walletBalance: Double
    let pendingClearance: Double
    let totalWithdrawn: Double
    let payoutEnabled: Bool
    let verificationStatus: String
}

class APIClient {
    static let shared = APIClient()
    private let baseURL = URL(string: "http://localhost:3001/api/")!
    
    private init() {}
    
    func request<T: Codable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil,
        token: String? = nil
    ) async throws -> T {
        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw APIError.invalidResponse
            }
            
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch let error as DecodingError {
            throw APIError.decodingFailed(error)
        } catch {
            throw APIError.requestFailed(error)
        }
    }
}
