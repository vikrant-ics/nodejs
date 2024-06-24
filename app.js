// app.js

const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// PostgreSQL configuration
const pool = new Pool({
  user: 'myadmin',
  host: 'pgsql-vystar.postgres.database.azure.com',
  database: 'mypsqldb',
  password: 'Admin@123',
  port: 5432, // Default PostgreSQL port
});

// Define a route to fetch and display tables
app.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\'');
    console.log(`tables selected ${result}`)
    const tables = result.rows.map(row => row.table_name);
    client.release();
    
    // Render the tables list in a simple HTML format
    let html = '<h1>Tables in the Database</h1><ul>';
    tables.forEach(table => {
      html += `<li>${table}</li>`;
    });
    html += '</ul>';
    
    res.send(html);
  } catch (err) {
    console.error('Error fetching tables', err);
    res.status(500).send('Error fetching tables');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
