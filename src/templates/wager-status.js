module.exports = (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wager Status</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
  <div class="max-w-lg mx-auto p-4">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold mb-4">Wager Status</h1>
      
      <div class="space-y-4">
        <div class="flex justify-between">
          <span class="font-medium">Amount:</span>
          <span>$${data.amount.toFixed(2)}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="font-medium">Status:</span>
          <span class="px-2 py-1 rounded ${
            data.status === 'active' ? 'bg-green-100 text-green-800' :
            data.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }">${data.status}</span>
        </div>
        
        ${data.result ? `
        <div class="flex justify-between">
          <span class="font-medium">Result:</span>
          <span class="${
            data.result === 'won' ? 'text-green-600' : 'text-red-600'
          }">${data.result}</span>
        </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
`;