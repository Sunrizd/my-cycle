const express = require('express');
const db = require('../database');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key_change_me';

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    req.user = user;
    next();
  });
};

// Get all users
router.get('/users', isAdmin, (req, res) => {
  db.all('SELECT id, username, role, created_at FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete user
router.delete('/users/:id', isAdmin, (req, res) => {
  const targetId = req.params.id;

  // Prevent deleting self (admin) or demo account from here if desired
  // Check target user first
  db.get('SELECT username FROM users WHERE id = ?', [targetId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    if (row.username === 'admin' || row.username === 'demo') {
      return res.status(403).json({ error: 'Cannot delete system accounts' });
    }

    db.run('DELETE FROM users WHERE id = ?', [targetId], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Cleanup data
      db.run('DELETE FROM cycles WHERE user_id = ?', [targetId]);
      db.run('DELETE FROM symptoms WHERE user_id = ?', [targetId]);
      db.run('DELETE FROM settings WHERE user_id = ?', [targetId]);

      res.json({ message: 'User deleted' });
    });
  });
});

module.exports = router;
