exports.up = function(knex) {
  return knex.schema
    .createTable('geofences', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.jsonb('center').notNullable();
      table.float('radius').notNullable(); // in kilometers
      table.jsonb('restrictions');
      table.string('status').notNullable();
      table.timestamps(true, true);
      table.index('status');
    })
    
    .createTable('geofence_logs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('geofence_id').references('id').inTable('geofences').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.boolean('inside').notNullable();
      table.float('distance');
      table.jsonb('location');
      table.timestamp('checked_at').notNullable();
      table.timestamps(true, true);
      table.index(['geofence_id', 'user_id']);
      table.index('checked_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('geofence_logs')
    .dropTableIfExists('geofences');
};