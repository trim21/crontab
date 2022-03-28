const fs = require('fs')

const dayjs = require('dayjs')

const ENV_FILE = process.env.GITHUB_ENV

/**
 * @var {dayjs.Dayjs}
 */
const today = new dayjs()

/**
 *
 * @param d {dayjs.Dayjs}
 * @return {string}
 */
function toString(d) {
  return `${d.year()}-${d.month() + 1}-${d.date()}`
}

fs.appendFileSync(ENV_FILE, `Y=${today.year()}\n`)
fs.appendFileSync(ENV_FILE, `M=${today.month() + 1}\n`)
fs.appendFileSync(ENV_FILE, `D=${today.date()}\n`)

fs.appendFileSync(ENV_FILE, `TODAY=${toString(today)}\n`)
fs.appendFileSync(ENV_FILE, `D1=${toString(today.subtract(1, 'd'))}\n`)
fs.appendFileSync(ENV_FILE, `D2=${toString(today.subtract(2, 'd'))}\n`)
