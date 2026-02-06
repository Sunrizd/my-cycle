const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database is in ../data/database.sqlite relative to server/ folder?
// server/index.js uses '../data/database.sqlite'.
// So if this script is in server/, then '../data/database.sqlite' is consistent.
const dbPath = path.resolve(__dirname, '../data/database.sqlite');
const db = new sqlite3.Database(dbPath);

const username = process.argv[2] || 'admin';

console.log(`Updating role for user: ${username} in DB: ${dbPath}`);

db.run("UPDATE users SET role = 'admin' WHERE username = ?", [username], function (err) {
  if (err) {
    console.error('Error:', err.message);
  } else {
    if (this.changes > 0) {
      console.log(`SUCCESS: User ${username} role updated to 'admin'.`);
    } else {
      console.log(`WARNING: User ${username} not found or role already set.`);
    }
  }
  // Verify
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (row) console.log('Current User Row:', row);
    db.close();
  });
});
