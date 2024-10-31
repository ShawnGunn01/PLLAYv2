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
    
    .createTable('watchlist_screenings', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('screening_id').notNullable();
      table.string('status').notNullable();
      table.jsonb('search_terms');
      table.jsonb('hits');
      table.timestamp('next_review');
      table.timestamps(true, true);
      table.index(['user_id', 'status']);
      table.index('screening_id');
    })
    
    .createTable('kyc_documents', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('verification_id').references('id').inTable('kyc_verifications').onDelete('CASCADE');
      table.string('document_type').notNullable();
      table.string('document_number');
      table.date('expiry_date');
      table.string('issuing_country');
      table.jsonb('metadata');
      table.timestamps(true, true);
      table.index('verification_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('kyc_documents')
    .dropTableIfExists('watchlist_screenings')
    .dropTableIfExists('kyc_verifications');
};