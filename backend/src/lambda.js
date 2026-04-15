const serverless = require('serverless-http');
const { app, ensureInitialized } = require('./server');

// Wrap the Express app with serverless-http
const handler = serverless(app);

// AWS Lambda handler
module.exports.handler = async (event, context) => {
  // Ensure database connections and other asynchronous initializations are done
  await ensureInitialized();

  // Pass the event and context to the serverless-http handler
  return await handler(event, context);
};
