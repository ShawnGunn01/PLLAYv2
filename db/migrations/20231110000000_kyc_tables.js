exports.up = function(knex) {
  return knex.schema
    .createTable('kyc_verifications', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('verification_id').notNullable();
      table.string('status').notNullable();
      table.jsonb('identity_data');
      table.jsonb('steps_completed');
      table.timestamp('verified_at');
      table.timestamps(true, true);
      table.index(['user_id', 'status']);
      table.index('verification_id');
    })
    
    .alterTable('users', table => {
      table.boolean('kyc_verified').defaultTo(false);
      table.timestamp('kyc_verified_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('users', table => {
      table.dropColumn('kyc_verified');
      table.dropColumn('kyc_verified_at');
    })
    .dropTableIfExists('kyc_verifications');
};