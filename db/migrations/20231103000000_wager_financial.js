exports.up = function(knex) {
  return knex.schema
    // Wallet table to track user balances
    .createTable('wallets', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.decimal('balance', 15, 2).notNullable().defaultTo(0);
      table.decimal('pending_balance', 15, 2).notNullable().defaultTo(0);
      table.decimal('lifetime_deposits', 15, 2).notNullable().defaultTo(0);
      table.decimal('lifetime_withdrawals', 15, 2).notNullable().defaultTo(0);
      table.decimal('lifetime_winnings', 15, 2).notNullable().defaultTo(0);
      table.timestamps(true, true);
      table.unique(['user_id']);
    })

    // Transaction history
    .createTable('transactions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('wallet_id').references('id').inTable('wallets').onDelete('CASCADE');
      table.string('type').notNullable(); // deposit, withdrawal, wager, winning, refund
      table.decimal('amount', 15, 2).notNullable();
      table.string('status').notNullable(); // pending, completed, failed, cancelled
      table.string('payment_method'); // bank, crypto, card
      table.string('payment_id'); // External payment reference
      table.jsonb('metadata');
      table.timestamp('processed_at');
      table.timestamps(true, true);
      table.index(['wallet_id', 'type', 'status']);
      table.index('processed_at');
    })

    // Wager statistics
    .createTable('wager_stats', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('total_wagers').defaultTo(0);
      table.integer('wagers_won').defaultTo(0);
      table.integer('wagers_lost').defaultTo(0);
      table.decimal('total_wagered', 15, 2).defaultTo(0);
      table.decimal('total_won', 15, 2).defaultTo(0);
      table.decimal('total_lost', 15, 2).defaultTo(0);
      table.decimal('biggest_win', 15, 2).defaultTo(0);
      table.decimal('biggest_loss', 15, 2).defaultTo(0);
      table.decimal('win_rate').defaultTo(0);
      table.timestamps(true, true);
      table.unique(['user_id']);
    })

    // Individual wager records
    .createTable('wager_history', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('game_id').references('id').inTable('games');
      table.decimal('amount', 15, 2).notNullable();
      table.string('status').notNullable(); // active, won, lost, cancelled
      table.decimal('potential_win', 15, 2);
      table.decimal('actual_win', 15, 2);
      table.jsonb('game_data');
      table.timestamp('completed_at');
      table.timestamps(true, true);
      table.index(['user_id', 'status']);
      table.index('completed_at');
    })

    // Payout requests
    .createTable('payouts', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.decimal('amount', 15, 2).notNullable();
      table.string('status').notNullable(); // pending, processing, completed, failed
      table.string('payout_method').notNullable(); // bank, crypto
      table.jsonb('payout_details');
      table.string('transaction_id');
      table.timestamp('processed_at');
      table.timestamps(true, true);
      table.index(['user_id', 'status']);
      table.index('processed_at');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('payouts')
    .dropTableIfExists('wager_history')
    .dropTableIfExists('wager_stats')
    .dropTableIfExists('transactions')
    .dropTableIfExists('wallets');
};