const knex = require('../src/db/knex');

async function setupTestDb() {
  try {
    // Run migrations
    await knex.migrate.latest();
    
    // Run seeds
    await knex.seed.run();
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}

async function teardownTestDb() {
  try {
    // Rollback all migrations
    await knex.migrate.rollback(undefined, true);
    
    // Close connection
    await knex.destroy();
    
    console.log('Test database teardown complete');
  } catch (error) {
    console.error('Test database teardown failed:', error);
    throw error;
  }
}

module.exports = {
  setupTestDb,
  teardownTestDb
};