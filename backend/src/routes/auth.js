const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// ─────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    const sql = getSql();

    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create user with a new unique tenant
    const userId = uuidv4();
    const tenantId = 't_' + uuidv4().substring(0, 8);
    const userRole = (role === 'admin' || role === 'super_admin') ? role : 'user';

    await sql`
      INSERT INTO users (id, name, email, password, role, tenant_id)
      VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${userRole}, ${tenantId})
    `;

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log audit
    logAudit(email, 'user.registered', userId, `New ${userRole} account created`);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          name,
          email,
          role: userRole,
          tenantId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    const sql = getSql();
    const users = await sql`SELECT * FROM users WHERE email = ${email} AND is_active = true`;

    if (!users.length) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const user = users[0];

    // Compare password
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log audit
    logAudit(user.email, 'user.login', user.id, 'User logged in');

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          business_id: user.business_id,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// GET /api/auth/me — Get current user profile
// ─────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// ─────────────────────────────────────────────────
// PUT /api/auth/profile — Update profile
// ─────────────────────────────────────────────────
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const sql = getSql();

    if (email && email !== req.user.email) {
      const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${req.user.id}`;
      if (existing.length) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use by another account.',
        });
      }
    }

    await sql`
      UPDATE users SET
        name = COALESCE(${name || null}, name),
        email = COALESCE(${email || null}, email),
        updated_at = NOW()
      WHERE id = ${req.user.id}
    `;

    const updated = await sql`SELECT id, name, email, role, tenant_id, business_id FROM users WHERE id = ${req.user.id}`;

    logAudit(req.user.email, 'user.profile_updated', req.user.id, 'Profile updated');

    res.json({
      success: true,
      data: { user: updated[0] },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// PUT /api/auth/password — Change password
// ─────────────────────────────────────────────────
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new passwords are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters.',
      });
    }

    const sql = getSql();
    const users = await sql`SELECT password FROM users WHERE id = ${req.user.id}`;

    if (!bcrypt.compareSync(currentPassword, users[0].password)) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.',
      });
    }

    const salt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await sql`UPDATE users SET password = ${hashedPassword}, updated_at = NOW() WHERE id = ${req.user.id}`;

    logAudit(req.user.email, 'user.password_changed', req.user.id, 'Password changed');

    res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
