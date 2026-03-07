const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');

/**
 * Log an audit event to the database.
 * @param {string} actor - Who performed the action (email or 'system')
 * @param {string} action - Action name (e.g. 'campaign.created')
 * @param {string} target - Target resource ID
 * @param {string} detail - Human-readable detail
 * @param {string} ipAddress - Optional IP address
 */
async function logAudit(actor, action, target, detail, ipAddress = null) {
  try {
    const sql = getSql();
    const id = uuidv4();
    await sql`
      INSERT INTO audit_logs (id, actor, action, target, detail, ip_address, ts)
      VALUES (${id}, ${actor}, ${action}, ${target}, ${detail}, ${ipAddress}, NOW())
    `;
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
