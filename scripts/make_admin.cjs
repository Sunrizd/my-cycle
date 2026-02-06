const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/database.sqlite');
const db = new sqlite3.Database(dbPath);

const username = process.argv[2];

if (!username) {
  console.log('Usage: node make_admin.cjs <username>');
  process.exit(1);
}

db.run("UPDATE users SET role = 'admin' WHERE username = ?", [username], function (err) {
  if (err) {
    console.error(err.message);
  } else {
    if (this.changes > 0) {
      console.log(`User ${username} promoted to admin.`);
    } else {
      console.log(`User ${username} not found.`);
    }
  }
  db.close();
});
