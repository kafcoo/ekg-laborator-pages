import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { atlas, measureRhythm, normalCycle, sample } from "./rhythms.js";
import { cumulative, longIntervals, matchPeaks, timeStats, welch } from "./analysis.js";

const close = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≠ ${expected}`);
};
const data = async name => JSON.parse(await readFile(new URL("data/" + name + ".json", import.meta.url), "utf8"));

close(normalCycle.q[0].t - normalCycle.p[0].t, .16);
const pvc = atlas.pvc.events.q;
close(pvc[2].t, 1.93);
close(pvc[3].t - pvc[1].t, 1.72);
assert.ok(pvc[2].t < atlas.sinus.events.q[2].t);
const av = atlas.mobitz1.events;
[.16,.22,.26].forEach((value, i) => close(av.q[i].t - av.p[i].t, value));
assert.ok(!av.q.some(event => event.p === av.p[3].t));
close(av.q[3].t - av.p[4].t, .16);
const measured = (name, lead = "II") => measureRhythm(atlas[name].events, atlas[name].duration, lead);
assert.deepEqual([...new Set(measured("mobitz1").pr)], [160, 220, 260]);
assert.deepEqual([...new Set(measured("mobitz2").pr)], [170]);
assert.deepEqual(measured("av3").pr, []);
assert.equal(measured("av3").otherQrs.length, 5);
assert.deepEqual([...new Set(measured("rbbb", "V1").widths)], [148]);
assert.deepEqual([...new Set(measured("rbbb", "V6").widths)], [150]);
assert.deepEqual([...new Set(measured("bigeminy").rr)], [540, 1180]);
for (const scene of Object.values(atlas)) {
  assert.ok(scene.events.q.filter(event => event.t < scene.duration).length >= 3, scene.name);
  for (const lead of scene.leads) {
    const trace = sample(scene.events, lead, 0, scene.duration);
    assert.ok(trace.every(Number.isFinite) && Math.max(...trace) > 0, scene.name + " " + lead);
  }
}

assert.deepEqual(matchPeaks([100, 200, 500], [89, 100, 250, 699], 50), {
  pairs: [[100,89],[200,250]], falsePositives: [100,699], missed: [500],
});
assert.deepEqual(matchPeaks([], [100]), { pairs: [], falsePositives: [100], missed: [] });
const noisy = await data("qrs-noisy");
const result = matchPeaks(noisy.ref, noisy.pan);
assert.equal(result.pairs.length, 18);
assert.deepEqual(result.falsePositives, []);
assert.deepEqual(result.missed, [8040]);
const real = await data("qrs-emg");
assert.equal(real.ref, null);
assert.equal(real.search.length, 2);

const stats = timeStats([800,850,800,850]);
close(stats.sdnn, 28.867513459481287);
close(stats.rmssd, 50);
assert.equal(stats.nn50, 0);
assert.deepEqual(timeStats([800,null,850,830]).pairs, [[850,830]]);
assert.deepEqual(cumulative([800,1650,850]), [0,.8,2.45,3.3]);
const long = longIntervals();
const { series, df, segments } = welch(long, cumulative(long).slice(1));
assert.equal(segments, 3);
for (const [start, end, expected] of [[.04,.15,.1],[.15,.40,.24]]) {
  const peak = series.map((value, i) => ({ value, frequency: i * df }))
    .filter(({ frequency }) => frequency >= start && frequency < end)
    .sort((a, b) => b.value - a.value)[0];
  close(peak.frequency, expected, df);
}

const recording = await data("filter");
assert.equal(recording.raw.length, 41355);
const at50Hz = values => {
  let real = 0, imag = 0;
  for (let i = 22000; i < 28000; i++) {
    const angle = 2 * Math.PI * 50 * i / 1000;
    real += values[i] * Math.cos(angle);
    imag -= values[i] * Math.sin(angle);
  }
  return Math.hypot(real, imag);
};
assert.ok(at50Hz(recording.notch) / at50Hz(recording.raw) < .002);
const rr = await data("rr");
assert.equal(rr.length, 73);
close(cumulative(rr).at(-1), 7.594);
assert.equal((await readFile(new URL("data/optical.i16", import.meta.url))).byteLength, 4100000);
console.log(`Ověřeno: ${Object.keys(atlas).length} karet, pilotní intervaly, QRS, HRV, filtrace a velikost optických dat.`);
