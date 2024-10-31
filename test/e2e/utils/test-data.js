const { v4: uuidv4 } = require('uuid');

const createTestUser = async () => {
  const userId = uuidv4();
  
  await db('users').insert({
    id: userId,
    pllay_user_id: `test_${userId}`,
    username: `testuser_${userId}`,
    metadata: {
      level: 1,
      rank: 'bronze'
    }
  });

  return { id: userId };
};

const createTestWallet = async (userId) => {
  const [wallet] = await db('wallets')
    .insert({
      user_id: userId,
      balance: 10000, // $100.00
      pending_balance: 0
    })
    .returning('*');

  return wallet;
};

const createTestPayment = async (userId, amount) => {
  const [payment] = await db('transactions')
    .insert({
      user_id: userId,
      type: 'deposit',
      amount,
      status: 'completed',
      payment_method: 'card',
      metadata: {
        card_last4: '4242'
      }
    })
    .returning('*');

  return payment;
};

module.exports = {
  createTestUser,
  createTestWallet,
  createTestPayment
};