import mysql from "mysql2/promise"
import "dotenv/config"

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error("DATABASE_URL is not set in environment")
}

export const pool = mysql.createPool({
  uri: url,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
})

export async function ping() {
  const [rows] = await pool.query("SELECT 1 AS ok")
  return rows
}
