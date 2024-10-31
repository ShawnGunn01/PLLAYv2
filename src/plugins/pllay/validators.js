const { PLLAYError } = require('./errors');

function validateScore(score, allowedTypes) {
  if (!score || typeof score !== 'object') {
    throw new PLLAYError('Score must be an object');
  }

  const scoreEntries = Object.entries(score);
  if (scoreEntries.length === 0) {
    throw new PLLAYError('Score object cannot be empty');
  }

  for (const [key, value] of scoreEntries) {
    if (!allowedTypes.has(key)) {
      throw new PLLAYError(`Invalid score type: ${key}`);
    }

    if (typeof value !== 'number' || isNaN(value)) {
      throw new PLLAYError(`Score value must be a number: ${key}`);
    }
  }

  return true;
}