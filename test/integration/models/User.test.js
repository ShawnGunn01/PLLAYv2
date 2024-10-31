const User = require('../../../src/models/User');
const knex = require('../../../src/db/knex');

describe('User Model', () => {
  beforeAll(async () => {
    await knex.migrate.latest();
  });

  afterAll(async () => {
    await knex.migrate.rollback(undefined, true);
    await knex.destroy();
  });

  beforeEach(async () => {
    await knex('users').del();
  });

  it('should create a user', async () => {
    const user = await User.query().insert({
      pllay_user_id: 'test-user',
      username: 'testuser',
      metadata: { level: 1 }
    });

    expect(user.id).toBeDefined();
    expect(user.pllay_user_id).toBe('test-user');
    expect(user.username).toBe('testuser');
    expect(user.metadata).toEqual({ level: 1 });
  });

  it('should enforce unique pllay_user_id', async () => {
    await User.query().insert({
      pllay_user_id: 'test-user',
      username: 'testuser1'
    });

    await expect(User.query().insert({
      pllay_user_id: 'test-user',
      username: 'testuser2'
    })).rejects.toThrow();
  });

  it('should fetch user with relations', async () => {
    const user = await User.query().insert({
      pllay_user_id: 'test-user',
      username: 'testuser'
    });

    const userWithRelations = await User.query()
      .findById(user.id)
      .withGraphFetched('[gameSessions, tournamentParticipations]');

    expect(userWithRelations.gameSessions).toEqual([]);
    expect(userWithRelations.tournamentParticipations).toEqual([]);
  });
});