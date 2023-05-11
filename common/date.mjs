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

core.exportVariable("Y", today.toISOString().slice(0, 4));
core.exportVariable("M", today.toISOString().slice(5, 7));
core.exportVariable("D", today.toISOString().slice(8, 10));
core.exportVariable("TODAY", toString(today));

[1, 2, 3].forEach((i) => {
  core.exportVariable(
    `D${i}`,
    toString(new Date(today.getTime() - i * 1000 * 3600 * 24))
  );
});
