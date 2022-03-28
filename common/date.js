const fs = require('fs')
const ENV_FILE = process.env.GITHUB_ENV ?? "./env_file"

const today = new Date()

/**
 *
 * @param d {Date}
 * @return {string}
 */
function toString(d) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`
}

fs.appendFileSync(ENV_FILE, `Y=${today.getUTCFullYear()}\n`)
fs.appendFileSync(ENV_FILE, `M=${today.getUTCMonth() + 1}\n`)
fs.appendFileSync(ENV_FILE, `D=${today.getUTCDate()}\n`)
fs.appendFileSync(ENV_FILE, `TODAY=${toString(today)}\n`)

today.setDate(today.getDate() - 1)
fs.appendFileSync(ENV_FILE, `D1=${toString(today)}\n`)

today.setDate(today.getDate() - 1)
fs.appendFileSync(ENV_FILE, `D2=${toString(today)}\n`)


// with open(ENV_FILE, "a+", encoding="utf-8") as env_file:
//     print(f"D1={today - timedelta(days=1)}", file=env_file)
//     print(f"D2={today - timedelta(days=2)}", file=env_file)
//     print(f"Y={today.year}", file=env_file)
//     print(f"M={today.month:02d}", file=env_file)
//     print(f"D={today.day:02d}", file=env_file)
