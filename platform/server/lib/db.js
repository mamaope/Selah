/**
 * SELAH — the database, and the audit that wraps it.
 *
 * 🔴 EVERY READ OF PERSONAL DATA GOES THROUGH `audited()`. Not by convention —
 *    the route handlers never touch `pool.query` directly for personal data.
 *
 * The thing that destroys a company holding Ugandan tax data is not a bad write.
 * It is somebody looking at data they had no business looking at, and nobody
 * ever knowing.
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

const query = (text, params) => pool.query(text, params);

/** Write to the append-only audit log. Never the data itself — only that it happened. */
async function audit({ actorId = null, subjectId = null, action, entity, entityId = null, detail = null, req = null }) {
  await pool.query(
    `INSERT INTO audit_log (actor_id, subject_id, action, entity, entity_id, detail, ip, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [actorId, subjectId, action, entity, entityId, detail,
     req?.ip || null, req?.get?.('user-agent') || null]
  );
}

/**
 * Run a query AND record that it happened. If the audit write fails, THE READ
 * FAILS TOO — because an unaudited read of special personal data is exactly the
 * thing we promised not to do.
 */
async function audited(ctx, fn) {
  const result = await fn();
  await audit(ctx);   // if this throws, the request fails. Deliberately.
  return result;
}

async function migrate() {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '..', 'db');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await pool.query(fs.readFileSync(path.join(dir, f), 'utf8'));
    console.log(`  ✓ migrated ${f}`);
  }
}

module.exports = { pool, query, audit, audited, migrate };
