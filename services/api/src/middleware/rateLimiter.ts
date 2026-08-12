import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});

export const locationRateLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 10, // Limit location updates per partner
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Location update rate limit exceeded' },
});
