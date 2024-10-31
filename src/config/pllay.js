require('dotenv').config();

module.exports = {
  PLLAY_API_URL: process.env.PLLAY_API_URL || 'https://api.pllay.io',
  PLAYER_BASE_URL: process.env.PLAYER_BASE_URL || 'https://player.pllay.io',
  PUBLIC_KEY: process.env.PUBLIC_KEY,
  GAME_ID: process.env.GAME_ID,
  GAME_SECRET_KEY: process.env.GAME_SECRET_KEY,
};