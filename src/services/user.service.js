const fetch = require('node-fetch');
const config = require('../config/pllay');

class UserService {
  constructor() {
    this.baseUrl = config.PLLAY_API_URL;
  }

  async connectUserAccount(userId, escsUserId) {
    // Store the connection between your user ID and PLLAY user ID
    // This is where you'd typically save to your database
    return {
      userId,
      escsUserId,
      connected: true,
      connectedAt: new Date().toISOString()
    };
  }

  async validatePayment(userId, wagerId, amount) {
    // Implement your payment validation logic here
    // This is where you'd verify the payment was successful
    return {
      userId,
      wagerId,
      amount,
      status: 'paid',
      paidAt: new Date().toISOString()
    };
  }
}

module.exports = new UserService();