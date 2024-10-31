const express = require('express');
const app = require('../src/server');

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      console.log(`Test server running on port ${server.address().port}`);
      resolve(server);
    });
  });
}

module.exports = {
  startServer
};