exports.up = function(knex) {
  return knex.schema
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('pllay_user_id').notNullable().unique();
      table.string('username').notNullable();
      table.jsonb('metadata');
      table.timestamps(true, true);
      table.index('pllay_user_id');
    })
    
    .createTable('game_sessions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('round_id').notNullable();
      table.string('tournament_id');
      table.string('status').notNullable();
      table.jsonb('score');
      table.timestamp('started_at').notNullable();
      table.timestamp('ended_at');
      table.timestamps(true, true);
      table.index(['user_id', 'status']);
      table.index('tournament_id');
    })
    
    .createTable('score_validations', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('game_session_id').references('id').inTable('game_sessions').onDelete('CASCADE');
      table.decimal('score').notNullable();
      table.decimal('client_score').notNullable();
      table.boolean('is_valid').notNullable();
      table.jsonb('metadata');
      table.timestamps(true, true);
      table.index('game_session_id');
    })
    
    .createTable('tournaments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('tournament_id').notNullable().unique();
      table.string('status').notNullable();
      table.jsonb('metadata');
      table.timestamp('started_at');
      table.timestamp('ended_at');
      table.timestamps(true, true);
      table.index('tournament_id');
      table.index('status');
    })
    
    .createTable('tournament_participants', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('tournament_id').references('id').inTable('tournaments').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('status').notNullable();
      table.jsonb('metadata');
      table.timestamps(true, true);
      table.unique(['tournament_id', 'user_id']);
      table.index(['tournament_id', 'status']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('tournament_participants')
    .dropTableIfExists('tournaments')
    .dropTableIfExists('score_validations')
    .dropTableIfExists('game_sessions')
    .dropTableIfExists('users');
};