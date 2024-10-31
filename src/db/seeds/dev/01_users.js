exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {
          pllay_user_id: 'test-user-1',
          username: 'testuser1',
          metadata: { level: 10, rank: 'gold' }
        },
        {
          pllay_user_id: 'test-user-2',
          username: 'testuser2',
          metadata: { level: 5, rank: 'silver' }
        }
      ]);
    });
};