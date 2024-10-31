const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

let mongoServer;

before(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Run migrations
  await execAsync('npm run migrate');

  // Seed test data
  await execAsync('npm run seed:test');
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});