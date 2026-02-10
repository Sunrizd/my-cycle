const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key_123'; // Use env in prod
const SALT_ROUNDS = 10;

const Auth = {
  register: (req, res) => {
    const { username, password, firstname } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password too short (min 8 chars)' });
    }

    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) return res.status(500).json({ error: 'Server error' });

      const sql = `INSERT INTO users (username, password_hash, firstname) VALUES (?, ?, ?)`;
      db.run(sql, [username, hash, firstname || null], function (err) {
        if (err) {
          if (err.message.includes('UNIQUE'))
            return res.status(409).json({ error: 'Username taken' });
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User created' });
      });
    });
  },

  login: (req, res) => {
    const { username, password, remember } = req.body;
    const sql = `SELECT * FROM users WHERE username = ?`;

    db.get(sql, [username], (err, row) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!row) return res.status(401).json({ error: 'Invalid credentials' });

      bcrypt.compare(password, row.password_hash, (err, result) => {
        if (result) {
          // Default 24h, if remember is true then 30 days
          const expiresIn = remember ? '30d' : '24h';
          const token = jwt.sign(
            { id: row.id, username: row.username, role: row.role },
            SECRET_KEY,
            { expiresIn }
          );
          res.json({ token, username: row.username, role: row.role, firstname: row.firstname });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    });
  },

  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  },

  hashPassword: async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }
};

module.exports = Auth;
