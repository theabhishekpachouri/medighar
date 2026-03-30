const { Pool } = require('pg');

// Database connection details
const pool = new Pool({
  user: 'postgres',           // Default user postgres hota hai
  host: 'localhost',          // Aapka local computer
  database: 'pharm',    // Jo DB aapne SQL mein banaya tha
  password: 'password ', // Jo naya password aapne set kiya
  port: 5432,                 // PostgreSQL ka default port
});

// Connection test karne ke liye
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log(' Database Connected Successfully!');
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
