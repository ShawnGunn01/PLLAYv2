const { RateLimitError } = require('../utils/errors');

const rateLimit = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const requestTimes = requests.get(ip);
    const windowStart = now - windowMs;

    // Filter out old requests
    const recentRequests = requestTimes.filter(time => time > windowStart);
    requests.set(ip, recentRequests);

    if (recentRequests.length >= max) {
      return next(new RateLimitError(message));
    }

    recentRequests.push(now);
    requests.set(ip, recentRequests);

    next();
  };
};

module.exports = rateLimit;