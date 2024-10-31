exports.up = function(knex) {
  return knex.schema
    .createTable('compliance_reports', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.jsonb('report_data').notNullable();
      table.timestamp('generated_at').notNullable();
      table.timestamp('period_start').notNullable();
      table.timestamp('period_end').notNullable();
      table.timestamps(true, true);
      table.index(['period_start', 'period_end']);
    })
    
    .createTable('suspicious_activities', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('type').notNullable();
      table.string('severity').notNullable();
      table.string('status').notNullable();
      table.jsonb('details');
      table.timestamp('detected_at').notNullable();
      table.timestamp('resolved_at');
      table.timestamps(true, true);
      table.index(['user_id', 'status']);
      table.index('detected_at');
    })
    
    .createTable('risk_assessments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('risk_level').notNullable();
      table.text('reason').notNullable();
      table.timestamp('assessed_at').notNullable();
      table.timestamps(true, true);
      table.index(['user_id', 'assessed_at']);
    })
    
    .alterTable('users', table => {
      table.string('risk_level').defaultTo('low');
      table.timestamp('risk_updated_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('users', table => {
      table.dropColumn('risk_level');
      table.dropColumn('risk_updated_at');
    })
    .dropTableIfExists('risk_assessments')
    .dropTableIfExists('suspicious_activities')
    .dropTableIfExists('compliance_reports');
};