import * as core from "@actions/core";

/**
 * @type {Date}
 */
const today = new Date();

/**
 *
 * @param d {Date}
 * @return {string}
 */
function toString(d) {
  return d.toISOString().slice(0, "yyyy-mm-dd".length);
}

let year = parseInt(today.toISOString().slice(0, 4), 10);
let month = parseInt(today.toISOString().slice(5, 7), 10);

core.exportVariable("TODAY", toString(today));

core.exportVariable("Y", today.toISOString().slice(0, 4));
core.exportVariable("M", today.toISOString().slice(5, 7));
core.exportVariable("D", today.toISOString().slice(8, 10));

[1, 2, 3].forEach((i) => {
  core.exportVariable(
    `D${i}`,
    toString(new Date(today.getTime() - i * 1000 * 3600 * 24)),
  );
});

month = month - 1;

if (month === 0) {
  year = year - 1;
  month = 12;
}

core.exportVariable("M_1", `${year}-${month.toString().padStart(2, "0")}`);
core.exportVariable(
  "LAST_MONTH",
  `${year}-${month.toString().padStart(2, "0")}`,
);
core.exportVariable("Y_1", `${year}`);
core.exportVariable("LAST_YEAR", `${year}`);
