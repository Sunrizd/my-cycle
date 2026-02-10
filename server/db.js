const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(__dirname, '../data/period_tracker.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

    // Settings Table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            key TEXT,
            value TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

    // Cycles Table
    db.run(`CREATE TABLE IF NOT EXISTS cycles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            start_date TEXT,
            end_date TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

    // Symptoms Table
    db.run(`CREATE TABLE IF NOT EXISTS symptoms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date TEXT,
            data TEXT, -- JSON string
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

    // MIGRATIONS - Run blindly, ignore errors if column exists
    // This ensures they are in the serialization queue and finish before server starts requests

    // Users columns
    db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", () => {});
    db.run('ALTER TABLE users ADD COLUMN email TEXT', () => {});
    db.run('ALTER TABLE users ADD COLUMN firstname TEXT', () => {});
    db.run('ALTER TABLE users ADD COLUMN share_token TEXT', () => {});

    // Settings columns
    db.run('ALTER TABLE settings ADD COLUMN key TEXT', () => {});
    db.run('ALTER TABLE settings ADD COLUMN value TEXT', () => {});

    // Unique Index for Settings (Update logic depends on this)
    // clean up duplicates first?
    db.run(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_user_key ON settings (user_id, key)',
      (err) => {
        if (err && err.message.includes('UNIQUE constraint failed')) {
          // Ignore unique constraint failure on creation if index already exists?
          // No, if index creation fails due to data, we need to clean data.
          console.log(
            'Unique index creation failed (might be duplicates). Attempts implicit cleanup not implemented safely here. Manually check DB if issues persist.'
          );
        }
      }
    );

    // Seed Default Admin if DB is new
    db.get('SELECT count(*) as count FROM users', (err, row) => {
      if (err) return console.error(err.message);
      if (row.count === 0) {
        console.log('No users found. Creating default admin...');
        const adminUser = process.env.DEFAULT_ADMIN_USER || 'admin';
        const adminPass = process.env.DEFAULT_ADMIN_PASS || 'admin';
        const saltRounds = 10;

        bcrypt.hash(adminPass, saltRounds, (err, hash) => {
          if (err) return console.error(err);
          db.run(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
            [adminUser, hash],
            (err) => {
              if (err) console.error('Failed to create default admin', err);
              else console.log(`Default admin created: ${adminUser} / ${adminPass}`);
            }
          );
        });
      }
    });
  });
}

module.exports = db;
