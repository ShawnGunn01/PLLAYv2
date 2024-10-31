exports.up = function(knex) {
  return knex.schema
    .createTable('user_activities', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('type').notNullable();
      table.jsonb('metadata');
      table.timestamp('performed_at').notNullable();
      table.timestamps(true, true);
      table.index(['user_id', 'type']);
      table.index('performed_at');
    })
    
    .createTable('api_metrics', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('endpoint').notNullable();
      table.integer('status_code').notNullable();
      table.float('response_time').notNullable();
      table.string('method').notNullable();
      table.timestamp('timestamp').notNullable();
      table.timestamps(true, true);
      table.index(['endpoint', 'timestamp']);
      table.index('status_code');
    })
    
    .createTable('error_logs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('type').notNullable();
      table.text('message').notNullable();
      table.text('stack_trace');
      table.jsonb('context');
      table.timestamp('timestamp').notNullable();
      table.timestamps(true, true);
      table.index(['type', 'timestamp']);
    })
    
    .createTable('performance_metrics', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.jsonb('metrics_data').notNullable();
      table.timestamp('collected_at').notNullable();
      table.timestamps(true, true);
      table.index('collected_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('performance_metrics')
    .dropTableIfExists('error_logs')
    .dropTableIfExists('api_metrics')
    .dropTableIfExists('user_activities');
};