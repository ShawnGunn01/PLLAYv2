module.exports = async () => {
  // Close test server
  await global.__SERVER__.close();
  
  // Clean up any other global test resources
};