const express = require('express');
const { getSql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/audit-logs
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { action, actor, limit, offset } = req.query;

    const parsedLimit = limit ? parseInt(limit) : 100;
    const parsedOffset = offset ? parseInt(offset) : 0;

    const logs = await sql`
      SELECT * FROM audit_logs 
      WHERE 1=1
      ${action ? sql`AND action LIKE ${'%' + action + '%'}` : sql``}
      ${actor ? sql`AND actor LIKE ${'%' + actor + '%'}` : sql``}
      ORDER BY ts DESC
      LIMIT ${parsedLimit}
      OFFSET ${parsedOffset}
    `;

    const parsed = logs.map(l => ({
      id: l.id, actor: l.actor, action: l.action,
      target: l.target, detail: l.detail,
      ipAddress: l.ip_address, ts: l.ts,
    }));
    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) { next(err); }
});

module.exports = router;
