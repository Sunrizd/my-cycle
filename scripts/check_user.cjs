const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/database.sqlite');
const db = new sqlite3.Database(dbPath);

const username = process.argv[2];

if (!username) {
  console.log('Usage: node check_user.cjs <username>');
  process.exit(1);
}

db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('User details:', row);
  }
  db.close();
});
