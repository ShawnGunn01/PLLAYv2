exports.up = function(knex) {
  return knex.schema
    .createTable('sweepstakes', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description').notNullable();
      table.timestamp('start_date').notNullable();
      table.timestamp('end_date').notNullable();
      table.decimal('prize_pool', 15, 2).notNullable();
      table.integer('max_entries').notNullable();
      table.jsonb('entry_requirements');
      table.jsonb('drawing_rules');
      table.string('status').notNullable();
      table.timestamp('completed_at');
      table.timestamps(true, true);
      table.index(['status', 'end_date']);
    })
    
    .createTable('sweepstakes_entries', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('sweepstakes_id').references('id').inTable('sweepstakes').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('entry_number').notNullable();
      table.timestamps(true, true);
      table.unique(['sweepstakes_id', 'entry_number']);
      table.index(['sweepstakes_id', 'user_id']);
    })
    
    .createTable('sweepstakes_winners', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('sweepstakes_id').references('id').inTable('sweepstakes').onDelete('CASCADE');
      table.uuid('entry_id').references('id').inTable('sweepstakes_entries').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('prize_rank').notNullable();
      table.decimal('prize_amount', 15, 2).notNullable();
      table.timestamp('claimed_at');
      table.timestamps(true, true);
      table.unique(['sweepstakes_id', 'prize_rank']);
      table.index(['user_id', 'claimed_at']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('sweepstakes_winners')
    .dropTableIfExists('sweepstakes_entries')
    .dropTableIfExists('sweepstakes');
};