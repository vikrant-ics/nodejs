const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const ejs = require('ejs');

const app = express();
const port = process.env.PORT || 3000;

// Import the applicationinsights module
const appInsights = require('applicationinsights');

// Load environment variables from a .env file if available
require('dotenv').config();

// Initialize the Application Insights with your Instrumentation Key or Connection String
appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoDependencyCorrelation(true)
    .start();

// Get the default client
const client = appInsights.defaultClient;

function logException() {
    try {
        throw new Error("This is a test exception");
    } catch (error) {
        client.trackException({ exception: error });
    }
}

function logConsoleMessage(message) {
    console.log(message); // Output to console

    // Send console log message to Application Insights as a custom event
    client.trackEvent({ name: "ConsoleLog", properties: { message: message } });
}

logConsoleMessage("*Console log message from poc container*");

// PostgreSQL configuration
const pgPool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST || 'pgsql-vystar.postgres.database.azure.com',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
  ssl: {
    rejectUnauthorized: false  // This will allow self-signed certificates. For production, you should use a CA signed certificate.
  }
});

// Redis configuration
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'vystar.redis.cache.windows.net',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  socket: {
    tls: false,
    rejectUnauthorized: false // This should be adjusted based on your security requirements
  }
});

async function connectToDatabase() {
  try {
    const client = await pgPool.connect();
    console.log('Connected to database successfully');
    logConsoleMessage("Connected to database successfully");
    client.release();
  } catch (error) {
    console.error('Failed to connect to the database', error);
    logConsoleMessage("Failed to connect to the database", error);
    throw new Error('Database connection failed');
  }
}

connectToDatabase().catch(error => {
  console.error('Error:', error.message);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (rderr) => {
  console.error('Redis Cache Connection Error:', rderr);
});

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Routes
app.get('/json', async (req, res) => {
  try {
    // Check if data is in Redis cache
    const cachedUsers = await getCachedUsers();
    if (cachedUsers) {
      console.log('Data retrieved from Redis cache');
      res.json({ users: cachedUsers, source: 'Redis' });
    } else {
      // If not in cache, retrieve from PostgreSQL and store in Redis
      const result = await pgPool.query('SELECT * FROM users');
      const users = result.rows;

      console.log('Data retrieved from PostgreSQL');
      // Store data in Redis cache
      setCachedUsers(users);

      res.json({ users, source: 'PostgreSQL' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Helper function to get data from Redis cache
async function getCachedUsers() {
  return new Promise((resolve, reject) => {
    redisClient.get('users', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data ? JSON.parse(data) : null);
      }
    });
  });
}

// Helper function to set data in Redis cache
function setCachedUsers(users) {
  redisClient.set('users', JSON.stringify(users));
}

// Routes
app.get('/', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM users');
    const users = result.rows;
    res.render('index', { users });
  } catch (error) {
    console.error('PostgreSQL Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/users', async (req, res) => {
  const { name, email } = req.body;

  try {
    const result = await pgPool.query('INSERT INTO users(name, email) VALUES($1, $2) RETURNING *', [name, email]);
    const newUser = result.rows[0];

    // Clear Redis cache after adding a new user
    redisClient.del('users');
    logConsoleMessage("Insert the entry", name);
    res.redirect('/');
  } catch (error) {
    console.error('PostgreSQL Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/users/delete/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    await pgPool.query('DELETE FROM users WHERE id = $1', [userId]);

    // Clear Redis cache after deleting a user
    redisClient.del('users');

    res.redirect('/');
  } catch (error) {
    console.error('PostgreSQL Error:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Handle invalid routes
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});