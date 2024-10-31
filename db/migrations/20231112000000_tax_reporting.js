exports.up = function(knex) {
  return knex.schema
    .createTable('tax_reports', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('year').notNullable();
      table.string('report_type').notNullable();
      table.decimal('total_amount', 15, 2).notNullable();
      table.decimal('withholding_amount', 15, 2).notNullable();
      table.jsonb('report_data').notNullable();
      table.timestamp('generated_at').notNullable();
      table.timestamps(true, true);
      table.index(['user_id', 'year']);
      table.index('report_type');
    })
    
    .createTable('tax_files', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.integer('year').notNullable();
      table.string('type').notNullable();
      table.jsonb('file_data').notNullable();
      table.string('file_path');
      table.timestamp('submitted_at');
      table.timestamps(true, true);
      table.index(['year', 'type']);
    })
    
    .createTable('withholding_records', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('wager_id').references('id').inTable('wager_history');
      table.decimal('amount', 15, 2).notNullable();
      table.string('type').notNullable();
      table.timestamp('withheld_at').notNullable();
      table.timestamps(true, true);
      table.index(['user_id', 'type']);
      table.index('wager_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('withholding_records')
    .dropTableIfExists('tax_files')
    .dropTableIfExists('tax_reports');
};