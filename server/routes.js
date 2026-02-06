const express = require('express');
const router = express.Router();
const db = require('./db');
const Auth = require('./auth');

// Auth Routes
router.post('/auth/register', Auth.register);
router.post('/auth/login', Auth.login);

// Protected Routes
router.use('/api', Auth.authenticateToken);

// --- User Profile ---
router.get('/api/profile', (req, res) => {
  db.get('SELECT username, email, firstname FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

router.put('/api/profile', async (req, res) => {
  const { email, password, firstname } = req.body;

  try {
    if (password) {
      if (password.length < 8) {
          return res.status(400).json({ error: 'Password too short (min 8 chars)' });
      }
      const hash = await Auth.hashPassword(password);
      db.run(
        `UPDATE users SET email = ?, firstname = ?, password_hash = ? WHERE id = ?`,
        [email, firstname, hash, req.user.id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Profile updated' });
        }
      );
    } else {
      db.run(
        `UPDATE users SET email = ?, firstname = ? WHERE id = ?`,
        [email, firstname, req.user.id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Profile updated' });
        }
      );
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/api/users/me', (req, res) => {
  const userId = req.user.id;
  db.serialize(() => {
    db.run('DELETE FROM cycles WHERE user_id = ?', [userId]);
    db.run('DELETE FROM symptoms WHERE user_id = ?', [userId]);
    db.run('DELETE FROM settings WHERE user_id = ?', [userId]);
    db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Account deleted' });
    });
  });
});

// --- Settings ---
router.get('/api/settings', (req, res) => {
  console.log('GET /api/settings for user:', req.user.id);
  db.all(`SELECT key, value FROM settings WHERE user_id = ?`, [req.user.id], (err, rows) => {
    if (err) {
      console.error('Error fetching settings:', err);
      return res.status(500).json({ error: err.message });
    }
    const settings = {};
    rows.forEach((r) => (settings[r.key] = r.value));
    console.log('Returning settings:', settings);
    res.json(settings);
  });
});

router.post('/api/settings', (req, res) => {
  const settings = req.body;
  console.log('Received settings update:', settings, 'for user:', req.user.id);
  const stmt = db.prepare(`INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)`);

  // Simplistic batch insert
  db.serialize(() => {
    const promises = [];
    for (const [key, value] of Object.entries(settings)) {
      promises.push(
        new Promise((resolve, reject) => {
          stmt.run(req.user.id, key, String(value), (err) => {
            if (err) {
              console.error('Error saving setting:', key, err);
              reject(err);
            } else {
              resolve();
            }
          });
        })
      );
    }
    stmt.finalize();

    Promise.all(promises)
      .then(() => {
        console.log('Settings saved successfully.');
        res.json({ message: 'Settings saved' });
      })
      .catch((err) => {
        res.status(500).json({ error: 'Partial save error' });
      });
  });
});

// --- Cycles ---
router.get('/api/cycles', (req, res) => {
  db.all(
    `SELECT * FROM cycles WHERE user_id = ? ORDER BY start_date DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.post('/api/cycles', (req, res) => {
  const { start_date, end_date } = req.body;
  if (!start_date) return res.status(400).json({ error: 'Start date required' });

  // Check for existing cycle close to this date to update instead of insert
  // Heuristic: If new date is within 21 days of the latest cycle start, assume it's an edit of that cycle.
  db.get(
    `SELECT id, start_date FROM cycles WHERE user_id = ? ORDER BY start_date DESC LIMIT 1`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      let isUpdate = false;
      if (row) {
        const latestStart = new Date(row.start_date);
        const newStart = new Date(start_date);
        const diffTime = Math.abs(newStart - latestStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 21) {
          isUpdate = true;
          // Update existing
          db.run(
            `UPDATE cycles SET start_date = ?, end_date = ? WHERE id = ?`,
            [start_date, end_date, row.id],
            function (err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ id: row.id, start_date, end_date, message: 'Cycle updated' });
            }
          );
        }
      }

      if (!isUpdate) {
        db.run(
          `INSERT INTO cycles (user_id, start_date, end_date) VALUES (?, ?, ?)`,
          [req.user.id, start_date, end_date],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, start_date, end_date, message: 'Cycle added' });
          }
        );
      }
    }
  );
});

router.put('/api/cycles/:id', (req, res) => {
  const { start_date, end_date } = req.body;
  db.run(
    `UPDATE cycles SET start_date = ?, end_date = ? WHERE id = ? AND user_id = ?`,
    [start_date, end_date, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Cycle not found' });
      res.json({ message: 'Cycle updated' });
    }
  );
});

router.delete('/api/cycles/:id', (req, res) => {
  db.run(
    `DELETE FROM cycles WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Cycle not found' });
      res.json({ message: 'Cycle deleted' });
    }
  );
});

// --- Symptoms ---
router.get('/api/symptoms', (req, res) => {
  db.all(`SELECT date, data FROM symptoms WHERE user_id = ?`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse JSON data
    const result = {};
    rows.forEach((row) => {
      try {
        result[row.date] = JSON.parse(row.data);
      } catch (e) {
        /* ignore parse error */
      }
    });
    res.json(result);
  });
});

router.post('/api/symptoms', (req, res) => {
  const { date, data } = req.body; // data is object
  const dataStr = JSON.stringify(data);

  // Check if exists
  db.get(
    `SELECT id FROM symptoms WHERE user_id = ? AND date = ?`,
    [req.user.id, date],
    (err, row) => {
      if (row) {
        // Update
        db.run(`UPDATE symptoms SET data = ? WHERE id = ?`, [dataStr, row.id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Symptom updated' });
        });
      } else {
        // Insert
        db.run(
          `INSERT INTO symptoms (user_id, date, data) VALUES (?, ?, ?)`,
          [req.user.id, date, dataStr],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Symptom added' });
          }
        );
      }
    }
  );
});

// Admin Stats
router.get('/api/admin/stats', Auth.authenticateToken, (req, res) => {
  // Check role
  // We need to query the DB to be sure, or trust the token. Trusting token is faster.
  // In a real app we might check DB.
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const stats = {};

  // Count users
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.userCount = row.count;

    // Count cycles
    db.get('SELECT COUNT(*) as count FROM cycles', (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.cycleCount = row.count;

      res.json(stats);
    });
  });
});

// Admin Users Management
router.get('/api/admin/users', Auth.authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  db.all('SELECT id, username, role, created_at FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.delete('/api/admin/users/:id', Auth.authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const userId = req.params.id;
  // Prevent self-deletion
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  db.serialize(() => {
    db.run('DELETE FROM cycles WHERE user_id = ?', [userId]);
    db.run('DELETE FROM symptoms WHERE user_id = ?', [userId]);
    db.run('DELETE FROM settings WHERE user_id = ?', [userId]);
    db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User deleted' });
    });
  });
});

router.put('/api/admin/users/:id/password', Auth.authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const userId = req.params.id;
  const { password } = req.body;

  if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password too short (min 8 chars)' });
  }

  try {
      const hash = await Auth.hashPassword(password);
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
          res.json({ message: 'Password updated' });
      });
  } catch (e) {
      res.status(500).json({ error: 'Server error' });
  }
});

// --- Backup (Export/Import) ---
router.get('/api/backup', Auth.authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Fetch all user data in parallel
  const pUser = new Promise((resolve, reject) => {
      db.get('SELECT username, email, firstname, created_at FROM users WHERE id = ?', [userId], (err, row) => {
          if (err) reject(err); else resolve(row);
      });
  });

  const pCycles = new Promise((resolve, reject) => {
      db.all('SELECT start_date, end_date FROM cycles WHERE user_id = ?', [userId], (err, rows) => {
          if (err) reject(err); else resolve(rows);
      });
  });

  const pSymptoms = new Promise((resolve, reject) => {
      db.all('SELECT date, data FROM symptoms WHERE user_id = ?', [userId], (err, rows) => {
          if (err) reject(err); else resolve(rows);
      });
  });

  const pSettings = new Promise((resolve, reject) => {
      db.all('SELECT key, value FROM settings WHERE user_id = ?', [userId], (err, rows) => {
          if (err) reject(err); else resolve(rows);
      });
  });

  Promise.all([pUser, pCycles, pSymptoms, pSettings])
      .then(([user, cycles, symptoms, settings]) => {
          const backupData = {
              timestamp: new Date().toISOString(),
              version: 1,
              user: user,
              data: {
                  cycles: cycles,
                  symptoms: symptoms.map(s => {
                      try { return { date: s.date, data: JSON.parse(s.data) }; }
                      catch(e) { return null; }
                  }).filter(x => x),
                  settings: settings.reduce((acc, cur) => ({...acc, [cur.key]: cur.value}), {})
              }
          };
          res.json(backupData);
      })
      .catch(err => {
          res.status(500).json({ error: 'Export failed: ' + err.message });
      });
});

router.post('/api/backup', Auth.authenticateToken, (req, res) => {
   const backup = req.body;
   const userId = req.user.id;
   
   if (!backup || !backup.data) {
       return res.status(400).json({ error: 'Invalid backup format' });
   }

   db.serialize(() => {
       try {
           db.run('BEGIN TRANSACTION');

           // 1. Settings (Upsert)
           const settingsStmt = db.prepare(`INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)`);
           if (backup.data.settings) {
               for (const [key, value] of Object.entries(backup.data.settings)) {
                   settingsStmt.run(userId, key, String(value));
               }
           }
           settingsStmt.finalize();

           // 2. Cycles (Insert efficiently, ignoring exact duplicates if possible or manually checking)
           // Simple approach: Check if exists for that date, if not insert.
           const cycleStmt = db.prepare(`INSERT INTO cycles (user_id, start_date, end_date) 
               SELECT ?, ?, ? 
               WHERE NOT EXISTS (SELECT 1 FROM cycles WHERE user_id = ? AND start_date = ?)`);
           
           if (backup.data.cycles && Array.isArray(backup.data.cycles)) {
               for (const cycle of backup.data.cycles) {
                   cycleStmt.run(userId, cycle.start_date, cycle.end_date, userId, cycle.start_date);
               }
           }
           cycleStmt.finalize();

           // 3. Symptoms
           const symptomStmt = db.prepare(`INSERT OR REPLACE INTO symptoms (user_id, date, data) VALUES (?, ?, ?)`);
            if (backup.data.symptoms && Array.isArray(backup.data.symptoms)) {
               for (const sym of backup.data.symptoms) {
                   symptomStmt.run(userId, sym.date, JSON.stringify(sym.data));
               }
           }
           symptomStmt.finalize();
           
           // 4. Profile (Optional update)
           if (backup.user && (backup.user.firstname || backup.user.email)) {
               db.run('UPDATE users SET firstname = COALESCE(?, firstname), email = COALESCE(?, email) WHERE id = ?', 
               [backup.user.firstname, backup.user.email, userId]);
           }

           db.run('COMMIT', () => {
               res.json({ message: 'Import successful' });
           });

       } catch (e) {
           db.run('ROLLBACK');
           res.status(500).json({ error: 'Import failed: ' + e.message });
       }
   });
});

// --- Backup (Export/Import) ---
router.get('/api/backup', Auth.authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Fetch all user data in parallel
  const pUser = new Promise((resolve, reject) => {
      db.get('SELECT username, email, firstname, created_at FROM users WHERE id = ?', [userId], (err, row) => {
          if (err) reject(err); else resolve(row);
      });
  });

  const pCycles = new Promise((resolve, reject) => {
      db.all('SELECT start_date, end_date FROM cycles WHERE user_id = ?', [userId], (err, rows) => {
          if (err) reject(err); else resolve(rows);
      });
  });

  const pSymptoms = new Promise((resolve, reject) => {
      db.all('SELECT date, data FROM symptoms WHERE user_id = ?', [userId], (err, rows) => {
          if (err) reject(err); else resolve(rows);
      });
  });

  const pSettings = new Promise((resolve, reject) => {
      db.all('SELECT key, value FROM settings WHERE user_id = ?', [userId], (err, rows) => {
          if (err) reject(err); else resolve(rows);
      });
  });

  Promise.all([pUser, pCycles, pSymptoms, pSettings])
      .then(([user, cycles, symptoms, settings]) => {
          const backupData = {
              timestamp: new Date().toISOString(),
              version: 1,
              user: user,
              data: {
                  cycles: cycles,
                  symptoms: symptoms.map(s => {
                      try { return { date: s.date, data: JSON.parse(s.data) }; }
                      catch(e) { return null; }
                  }).filter(x => x),
                  settings: settings.reduce((acc, cur) => ({...acc, [cur.key]: cur.value}), {})
              }
          };
          res.json(backupData);
      })
      .catch(err => {
          res.status(500).json({ error: 'Export failed: ' + err.message });
      });
});

router.post('/api/backup', Auth.authenticateToken, (req, res) => {
   const backup = req.body;
   const userId = req.user.id;
   
   if (!backup || !backup.data) {
       return res.status(400).json({ error: 'Invalid backup format' });
   }

   db.serialize(() => {
       try {
           db.run('BEGIN TRANSACTION');

           // 1. Settings (Upsert)
           const settingsStmt = db.prepare(`INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)`);
           if (backup.data.settings) {
               for (const [key, value] of Object.entries(backup.data.settings)) {
                   settingsStmt.run(userId, key, String(value));
               }
           }
           settingsStmt.finalize();

           // 2. Cycles (Insert efficiently, ignoring exact duplicates if possible or manually checking)
           // Simple approach: Check if exists for that date, if not insert.
           const cycleStmt = db.prepare(`INSERT INTO cycles (user_id, start_date, end_date) 
               SELECT ?, ?, ? 
               WHERE NOT EXISTS (SELECT 1 FROM cycles WHERE user_id = ? AND start_date = ?)`);
           
           if (backup.data.cycles && Array.isArray(backup.data.cycles)) {
               for (const cycle of backup.data.cycles) {
                   cycleStmt.run(userId, cycle.start_date, cycle.end_date, userId, cycle.start_date);
               }
           }
           cycleStmt.finalize();

           // 3. Symptoms
           const symptomStmt = db.prepare(`INSERT OR REPLACE INTO symptoms (user_id, date, data) VALUES (?, ?, ?)`);
            if (backup.data.symptoms && Array.isArray(backup.data.symptoms)) {
               for (const sym of backup.data.symptoms) {
                   symptomStmt.run(userId, sym.date, JSON.stringify(sym.data));
               }
           }
           symptomStmt.finalize();
           
           // 4. Profile (Optional update)
           if (backup.user && (backup.user.firstname || backup.user.email)) {
               db.run('UPDATE users SET firstname = COALESCE(?, firstname), email = COALESCE(?, email) WHERE id = ?', 
               [backup.user.firstname, backup.user.email, userId]);
           }

           db.run('COMMIT', () => {
               res.json({ message: 'Import successful' });
           });

       } catch (e) {
           db.run('ROLLBACK');
           res.status(500).json({ error: 'Import failed: ' + e.message });
       }
   });
});

module.exports = router;
