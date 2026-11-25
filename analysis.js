export const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN;

export function sampleSD(values) {
  if (values.length < 2) return NaN;
  const mean = average(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
}

export function matchPeaks(reference, detections, tolerance = 100) {
  // Both arrays are time-ordered. Consume the earliest compatible pair.
  let i = 0, j = 0;
  const pairs = [];
  const falsePositives = [];
  const missed = [];
  while (i < reference.length && j < detections.length) {
    const delta = detections[j] - reference[i];
    if (delta < -tolerance) falsePositives.push(detections[j++]);
    else if (delta > tolerance) missed.push(reference[i++]);
    else pairs.push([reference[i++], detections[j++]]);
  }
  falsePositives.push(...detections.slice(j));
  missed.push(...reference.slice(i));
  return { pairs, falsePositives, missed };
}

export function cumulative(rr) {
  let t = 0;
  return [0, ...rr.map(value => (t += value) / 1000)];
}

export function timeStats(nn) {
  const valid = nn.filter(Number.isFinite);
  const pairs = nn.slice(1).flatMap((value, index) =>
    Number.isFinite(value) && Number.isFinite(nn[index]) ? [[nn[index], value]] : []);
  const differences = pairs.map(([a, b]) => b - a);
  const nn50 = differences.filter(value => Math.abs(value) > 50).length;
  return {
    count: valid.length,
    sdnn: sampleSD(valid),
    rmssd: Math.sqrt(average(differences.map(value => value ** 2))),
    nn50,
    pnn50: 100 * nn50 / differences.length,
    sd1: sampleSD(differences.map(v => v / Math.SQRT2)),
    sd2: sampleSD(pairs.map(([a, b]) => (a + b) / Math.SQRT2)),
    pairs,
  };
}

export function welch(rr, times, fs = 4) {
  const width = 512;
  const uniform = [];
  let j = 0;
  for (let t = times[0]; t <= times.at(-1); t += 1 / fs) {
    while (j + 1 < times.length - 1 && times[j + 1] < t) j++;
    const slope = (t - times[j]) / (times[j + 1] - times[j]);
    uniform.push(rr[j] * (1 - slope) + rr[j + 1] * slope);
  }
  const window = Array.from({ length: width }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / width));
  const scale = fs * window.reduce((sum, value) => sum + value ** 2, 0);
  const power = Array(width / 2 + 1).fill(0);
  let segments = 0;
  for (let start = 0; start + width <= uniform.length; start += width / 2) {
    const interval = uniform.slice(start, start + width);
    const mean = average(interval);
    const tapered = interval.map((value, i) => (value - mean) * window[i]);
    for (let bin = 0; bin < power.length; bin++) {
      const omega = 2 * Math.PI * bin / width;
      let re = 0, im = 0;
      tapered.forEach((value, i) => {
        re += value * Math.cos(omega * i);
        im -= value * Math.sin(omega * i);
      });
      power[bin] += (re ** 2 + im ** 2) / scale * ((bin && bin < width / 2) ? 2 : 1);
    }
    segments++;
  }
  return { series: power.map(value => value / segments), df: fs / width, segments };
}

export function longIntervals() {
  const values = [];
  let elapsed = 0;
  while (elapsed < 300) {
    const rr = Math.round(810 + 52 * Math.sin(2 * Math.PI * .24 * elapsed) + 35 * Math.sin(2 * Math.PI * .10 * elapsed));
    values.push(rr);
    elapsed += rr / 1000;
  }
  return values;
}
