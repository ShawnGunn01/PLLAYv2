const fetch = require('node-fetch');

async function testValidScore() {
  const response = await fetch('http://localhost:3000/validate-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tournamentId: '5f0f7c60c9e95137883b55cc',
      roundId: '5f158727c9e95137883b8b96',
      score: 100,
      clientScore: 100
    })
  });

  console.log('Valid score test:', await response.json());
}

async function testInvalidScore() {
  const response = await fetch('http://localhost:3000/validate-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tournamentId: '5f0f7c60c9e95137883b55cc',
      roundId: '5f158727c9e95137883b8b96',
      score: 100,
      clientScore: 200 // Mismatched score
    })
  });

  console.log('Invalid score test:', await response.json());
}

async function runTests() {
  try {
    await testValidScore();
    await testInvalidScore();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();