const fs = require('fs')

const dayjs = require('dayjs')

const ENV_FILE = process.env.GITHUB_ENV ?? './env_file'

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
  return d.format("YYYY-MM-DD")
}

fs.appendFileSync(ENV_FILE, `Y=${today.format('YYYY')}\n`)
fs.appendFileSync(ENV_FILE, `M=${today.format('MM')}\n`)
fs.appendFileSync(ENV_FILE, `D=${today.format('DD')}\n`)

fs.appendFileSync(ENV_FILE, `TODAY=${toString(today)}\n`)
fs.appendFileSync(ENV_FILE, `D1=${toString(today.subtract(1, 'd'))}\n`)
fs.appendFileSync(ENV_FILE, `D2=${toString(today.subtract(2, 'd'))}\n`)
