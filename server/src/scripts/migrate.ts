import { ensureSchema } from "../schema.js"
import { pool } from "../db.js"

async function main() {
  await ensureSchema()
  console.log("[migrate] schema ensured")
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
