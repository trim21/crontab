import * as core from '@actions/core';

import dayjs from "dayjs";

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

core.exportVariable('Y', today.format('YYYY'))
core.exportVariable('M', today.format('MM'))
core.exportVariable('D', today.format('DD'))
core.exportVariable('TODAY', toString(today))
core.exportVariable('D1', toString(today.subtract(1, 'd')))
core.exportVariable('D2', toString(today.subtract(2, 'd')))
