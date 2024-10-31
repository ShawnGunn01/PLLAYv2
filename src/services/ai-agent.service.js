// Add to existing functions array in getFunctions()
{
  name: 'generateWagerStatusPage',
  description: 'Generate a web page showing wager status',
  parameters: {
    type: 'object',
    properties: {
      wagerId: { type: 'string' }
    },
    required: ['wagerId']
  }
},
{
  name: 'generateLeaderboardPage',
  description: 'Generate a web page showing leaderboard',
  parameters: {
    type: 'object',
    properties: {
      gameId: { type: 'string' },
      timeframe: { type: 'string' }
    },
    required: ['gameId']
  }
}

// Add to handleFunctionCall method
case 'generateWagerStatusPage':
  const wagerStatus = await wagerService.getWagerStatus(parsedArgs.wagerId);
  const wagerPage = await aiAgentUIService.generatePage('wagerStatus', wagerStatus);
  return `View your wager status here: ${wagerPage.url}\nScan this QR code on mobile: ${wagerPage.qrCode}`;

case 'generateLeaderboardPage':
  const leaderboard = await leaderboardService.getGameLeaderboard(
    parsedArgs.gameId,
    parsedArgs.timeframe
  );
  const leaderboardPage = await aiAgentUIService.generatePage('leaderboard', {
    entries: leaderboard
  });
  return `View the leaderboard here: ${leaderboardPage.url}\nScan this QR code on mobile: ${leaderboardPage.qrCode}`;