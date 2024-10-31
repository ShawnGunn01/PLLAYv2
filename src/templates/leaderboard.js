module.exports = (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leaderboard</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
  <div class="max-w-lg mx-auto p-4">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold mb-4">Leaderboard</h1>
      
      <div class="space-y-4">
        ${data.entries.map((entry, index) => `
        <div class="flex items-center justify-between p-2 ${
          index % 2 === 0 ? 'bg-gray-50' : ''
        }">
          <div class="flex items-center space-x-4">
            <span class="font-bold ${
              index < 3 ? 'text-xl text-yellow-500' : ''
            }">#${index + 1}</span>
            <span>${entry.username}</span>
          </div>
          <span class="font-medium">${entry.score}</span>
        </div>
        `).join('')}
      </div>
    </div>
  </div>
</body>
</html>
`;