/**
 * Messaging Service — Centralized handler for SMS and Email delivery.
 */

'use strict';

const { getSql } = require('../db/init');

// In a real production app, you would use Twilio for SMS and Nodemailer/SendGrid for Email.
// Since we are in development, we will log the output and simulate the delivery.

async function sendSMS(phone, message, tenantId) {
  console.log(`[SMS] To: ${phone}, Tenant: ${tenantId}, Message: "${message}"`);
  
  // Implementation for Twilio would go here:
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE, to: phone });

  return { success: true, provider: 'simulated' };
}

async function sendEmail(email, subject, body, tenantId) {
  console.log(`[EMAIL] To: ${email}, Tenant: ${tenantId}, Subject: "${subject}", Body: "${body}"`);

  // Implementation for Resend/SendGrid/Nodemailer would go here:
  // await transporter.sendMail({ from: '"AutoRefer" <no-reply@autorefer.com>', to: email, subject, text: body });

  return { success: true, provider: 'simulated' };
}

/**
 * High-level function to send an incentive to a customer.
 */
async function sendIncentiveMessage(incentiveId, method, tenantId) {
  const sql = getSql();

  // 1. Fetch incentive details and customer contact info
  const results = await sql`
    SELECT i.*, ri.customer_identity_ref, c.name as campaign_name
    FROM incentives i
    LEFT JOIN review_intents ri ON i.review_intent_id = ri.review_intent_id
    LEFT JOIN campaigns c ON i.campaign_id = c.campaign_id
    WHERE i.incentive_id = ${incentiveId} AND i.tenant_id = ${tenantId}
  `;

  if (!results.length) throw new Error('Incentive not found');
  const inc = results[0];

  const contact = inc.customer_identity_ref || inc.customer_phone || inc.customer_email;
  if (!contact || contact === 'anonymous') {
    if (method !== 'manual') {
      throw new Error('No contact information (phone or email) found for this customer.');
    }
  }

  const incentiveLabel = inc.incentive_type === 'percent' ? `${inc.incentive_value}% off` :
                         inc.incentive_type === 'fixed' ? `$${parseFloat(inc.incentive_value).toFixed(2)} off` :
                         inc.incentive_value;

  const message = `Hi ${inc.customer_name || 'there'}! Here is your reward for your review at ${inc.campaign_name || 'our business'}: ${incentiveLabel}. ${inc.notes || ''}`;

  let finalMethod = method;
  if (method === 'auto') {
    // Determine method based on contact format
    if (contact.includes('@')) finalMethod = 'email';
    else if (contact.match(/^[\d+]{10,15}$/)) finalMethod = 'sms';
    else throw new Error('Could not automatically determine delivery method (contact is neither phone nor email).');
  }

  if (finalMethod === 'sms') {
    if (contact.includes('@')) throw new Error('Customer has email, but SMS was requested.');
    return await sendSMS(contact, message, tenantId);
  }

  if (finalMethod === 'email') {
    if (!contact.includes('@')) throw new Error('Customer has phone, but Email was requested.');
    return await sendEmail(contact, `Your reward from ${inc.campaign_name || 'AutoRefer'}`, message, tenantId);
  }

  if (finalMethod === 'manual') {
    console.log(`[MANUAL] Incentive ${incentiveId} marked as sent manually.`);
    return { success: true, provider: 'none' };
  }

  throw new Error(`Invalid send method: ${method}`);
}

module.exports = {
  sendSMS,
  sendEmail,
  sendIncentiveMessage
};
