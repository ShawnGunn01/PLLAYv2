exports.up = function(knex) {
  return knex.schema
    .createTable('user_security', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('tfa_secret');
      table.string('tfa_status');
      table.timestamp('last_verified');
      table.jsonb('security_settings');
      table.timestamps(true, true);
      table.unique(['user_id']);
    })
    
    .createTable('fraud_alerts', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('status').notNullable();
      table.jsonb('details');
      table.timestamp('detected_at').notNullable();
      table.timestamp('resolved_at');
      table.timestamps(true, true);
      table.index(['user_id', 'status']);
      table.index('detected_at');
    })
    
    .createTable('transaction_alerts', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('transaction_id').references('id').inTable('transactions');
      table.jsonb('alerts');
      table.string('status').notNullable();
      table.timestamps(true, true);
      table.index(['user_id', 'status']);
    })
    
    .createTable('ip_whitelist', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('ip_address').notNullable();
      table.string('description');
      table.boolean('active').defaultTo(true);
      table.timestamps(true, true);
      table.unique(['user_id', 'ip_address']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ip_whitelist')
    .dropTableIfExists('transaction_alerts')
    .dropTableIfExists('fraud_alerts')
    .dropTableIfExists('user_security');
};