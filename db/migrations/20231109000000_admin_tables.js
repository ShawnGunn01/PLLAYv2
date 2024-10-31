exports.up = function(knex) {
  return knex.schema
    .createTable('admin_actions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('admin_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('action_type').notNullable();
      table.string('target_type').notNullable();
      table.string('target_id').notNullable();
      table.jsonb('action_data');
      table.text('reason');
      table.timestamp('performed_at').notNullable();
      table.timestamps(true, true);
      table.index(['admin_id', 'action_type']);
      table.index(['target_type', 'target_id']);
      table.index('performed_at');
    })
    
    .createTable('admin_settings', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('key').notNullable().unique();
      table.jsonb('value').notNullable();
      table.string('description');
      table.timestamps(true, true);
    })
    
    .alterTable('users', table => {
      table.boolean('is_admin').defaultTo(false);
      table.jsonb('admin_permissions');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('users', table => {
      table.dropColumn('is_admin');
      table.dropColumn('admin_permissions');
    })
    .dropTableIfExists('admin_settings')
    .dropTableIfExists('admin_actions');
};