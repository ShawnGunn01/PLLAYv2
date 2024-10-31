exports.up = function(knex) {
  return knex.schema
    .createTable('user_profiles', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('username').notNullable();
      table.string('avatar_url');
      table.text('bio');
      table.jsonb('settings');
      table.integer('level').defaultTo(1);
      table.timestamps(true, true);
      table.unique(['user_id']);
      table.index('username');
    })
    
    .createTable('user_stats', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('game_id').references('id').inTable('games');
      table.integer('games_played').defaultTo(0);
      table.integer('wins').defaultTo(0);
      table.integer('losses').defaultTo(0);
      table.decimal('average_score').defaultTo(0);
      table.decimal('best_score').defaultTo(0);
      table.timestamps(true, true);
      table.unique(['user_id', 'game_id']);
      table.index(['user_id', 'game_id']);
    })
    
    .createTable('achievements', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('description').notNullable();
      table.string('icon_url');
      table.integer('points').defaultTo(0);
      table.timestamps(true, true);
    })
    
    .createTable('user_achievements', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('achievement_id').references('id').inTable('achievements').onDelete('CASCADE');
      table.timestamp('unlocked_at').notNullable();
      table.timestamps(true, true);
      table.unique(['user_id', 'achievement_id']);
      table.index(['user_id', 'unlocked_at']);
    })
    
    .createTable('leaderboard_entries', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('game_id').references('id').inTable('games');
      table.uuid('tournament_id').references('id').inTable('tournaments');
      table.decimal('score').notNullable();
      table.timestamp('recorded_at').notNullable();
      table.timestamps(true, true);
      table.index(['user_id', 'game_id', 'recorded_at']);
      table.index(['tournament_id', 'score']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('leaderboard_entries')
    .dropTableIfExists('user_achievements')
    .dropTableIfExists('achievements')
    .dropTableIfExists('user_stats')
    .dropTableIfExists('user_profiles');
};