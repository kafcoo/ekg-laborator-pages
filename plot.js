export const colors = {
  accent: "var(--accent)", alternate: "var(--chart-alt)", blue: "var(--chart-blue)",
  gold: "var(--chart-gold)", gray: "var(--muted)",
};
export const fmt = (x, digits = 1) => Number(x).toLocaleString("cs-CZ", { maximumFractionDigits: digits });
export const select = (id, label, items) => `<label for="${id}">${label} <select id="${id}">${items.map(([value, name]) => `<option value="${value}">${name}</option>`).join("")}</select></label>`;
export const canvas = (id, label, size = "") => `<canvas id="${id}" class="plot ${size}" role="img" aria-label="${label}">${label}</canvas>`;
export const details = (title, copy) => `<details><summary>${title}</summary><p>${copy}</p></details>`;
export const metric = (label, value) => `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`;
export const legend = items => `<div class="legend">${items.map(([color, label]) => `<span><i style="background:${color}"></i>${label}</span>`).join("")}</div>`;

let observer;
const plots = new Map();
let themeStyles;

export function redrawPlots() {
  themeStyles = undefined;
  for (const [element, config] of plots) draw(element, config);
}
export function clearPlots() {
  observer?.disconnect();
  plots.clear();
}

function ticks(min, max, target) {
  const raw = (max - min) / target;
  const scale = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find(value => value * scale >= raw) ?? 10) * scale;
  const result = [];
  for (let x = Math.ceil((min - step * 1e-8) / step) * step; x <= max + step * 1e-8; x += step) {
    result.push(Math.abs(x) < step * 1e-8 ? 0 : x);
  }
  return result;
}

export function plot(el, config) {
  observer ??= new ResizeObserver(entries => {
    for (const { target } of entries) {
      const current = plots.get(target);
      if (current) draw(target, current);
    }
  });
  if (!plots.has(el)) observer.observe(el);
  plots.set(el, config);
  draw(el, config);
}

function draw(el, options) {
  const { series, x, y, xLabel = "Čas [s]", yLabel = "Napětí [mV]", events = [], bands = [], brackets = [], paper = false, yNames } = options;
  const width = el.clientWidth, height = el.clientHeight;
  if (width < 90 || height < 65) return;
  const ratio = Math.min(2, devicePixelRatio || 1);
  if (el.width !== Math.round(width * ratio) || el.height !== Math.round(height * ratio)) {
    el.width = Math.round(width * ratio);
    el.height = Math.round(height * ratio);
  }
  themeStyles ??= getComputedStyle(document.documentElement);
  const paint = color => color.startsWith("var(") ? themeStyles.getPropertyValue(color.slice(4, -1)).trim() : color;
  const ctx = el.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const left = yNames ? 72 : 55, top = 25, right = width - 13, bottom = height - 36;
  const px = value => left + (value - x[0]) / (x[1] - x[0]) * (right - left);
  const py = value => bottom - (value - y[0]) / (y[1] - y[0]) * (bottom - top);
  const line = (x1, y1, x2, y2, color) => {
    ctx.strokeStyle = paint(color);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const xs = ticks(...x, width < 440 ? 4 : 8);
  const ys = yNames ? Object.keys(yNames).map(Number) : ticks(...y, 5);
  ctx.font = "11px system-ui";
  ctx.fillStyle = paint(colors.gray);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(yLabel, 9, 11);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();
  if (paper) {
    const horizontal = width / (x[1] - x[0]) > 290 ? .04 : .2;
    for (let t = Math.ceil(x[0] / horizontal) * horizontal; t <= x[1] + 1e-8; t += horizontal) {
      line(px(t), top, px(t), bottom, "var(--plot-grid-fine)");
    }
    const voltageGrid = (bottom - top) / (y[1] - y[0]) >= 73 ? .1 : .2;
    for (let v = Math.ceil(y[0] / voltageGrid) * voltageGrid; v <= y[1] + 1e-8; v += voltageGrid) {
      line(left, py(v), right, py(v), "var(--plot-grid-fine)");
    }
  }
  for (const v of ys) line(left, py(v), right, py(v), "var(--plot-grid)");
  for (const t of xs) line(px(t), top, px(t), bottom, "var(--plot-grid)");
  for (const { from, to, color } of bands) {
    ctx.fillStyle = paint(color);
    ctx.fillRect(px(from), top, px(to) - px(from), bottom - top);
  }
  for (const trace of series) {
    const { values, times, step = 1, start = 0, color = colors.accent, dots, bars, dashed } = trace;
    ctx.strokeStyle = ctx.fillStyle = paint(color);
    ctx.lineWidth = trace.width ?? 1.65;
    ctx.setLineDash(dashed ? [5, 4] : []);
    ctx.beginPath();
    let started = false;
    values.forEach((value, i) => {
      const t = times?.[i] ?? start + i * step;
      if (t < x[0] - (times ? 0 : step) || t > x[1] + (times ? 0 : step) || value == null || !Number.isFinite(value)) {
        started = false;
        return;
      }
      const screenX = px(t), screenY = py(value);
      if (bars) ctx.fillRect(screenX - bars / 2, screenY, bars, bottom - screenY);
      else if (dots) {
        ctx.moveTo(screenX + 2.5, screenY);
        ctx.arc(screenX, screenY, 2.5, 0, 2 * Math.PI);
      } else if (started) ctx.lineTo(screenX, screenY);
      else ctx.moveTo(screenX, screenY);
      started = true;
    });
    if (dots) ctx.fill();
    else if (!bars) ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  for (const { time, color = colors.gold, dash = true, lane = 0, partial, labelOnly } of events) {
    if (labelOnly || time < x[0] || time > x[1]) continue;
    const startY = top + lane * 14;
    ctx.setLineDash(dash ? [4, 4] : []);
    line(px(time), partial ? bottom - 12 - lane * 12 : startY, px(time), partial ? bottom - lane * 12 : bottom, color);
  }
  ctx.setLineDash([]);
  for (const { from, to, label, lane = 0, color = colors.gold } of brackets) {
    const yy = bottom - 14 - 19 * lane;
    line(px(from), yy, px(to), yy, color);
    for (const edge of [from, to]) line(px(edge), yy - 4, px(edge), yy + 4, color);
    if (label && px(to) - px(from) > ctx.measureText(label).width + 6) {
      ctx.fillStyle = paint(color);
      ctx.textAlign = "center";
      ctx.fillText(label, (px(from) + px(to)) / 2, yy - 8);
    }
  }
  ctx.restore();
  for (const { time, label, color = colors.gold, lane = 0 } of events) {
    if (!label || time < x[0] || time > x[1]) continue;
    ctx.fillStyle = paint(color);
    ctx.textAlign = "left";
    const textWidth = ctx.measureText(label).width;
    const tx = Math.max(left, Math.min(px(time) + 4, right - textWidth - 2));
    const ty = top + 8 + lane * 14;
    ctx.fillStyle = paint("var(--plot)");
    ctx.fillRect(tx - 2, ty - 6, textWidth + 4, 12);
    ctx.fillStyle = paint(color);
    ctx.fillText(label, tx, ty);
  }
  ctx.fillStyle = paint(colors.gray);
  ctx.textAlign = "right";
  for (const v of ys) ctx.fillText(yNames?.[v] ?? fmt(v, 5), left - 5, py(v));
  ctx.textAlign = "center";
  for (const t of xs) ctx.fillText(fmt(t, 3), px(t), bottom + 11);
  ctx.fillText(xLabel, (left + right) / 2, height - 8);
}

export function bounds(series, padding = .07) {
  let min = Infinity, max = -Infinity;
  for (const values of series) {
    for (const value of values) {
      if (value == null || !Number.isFinite(value)) continue;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  if (!Number.isFinite(min)) return [-1, 1];
  const margin = (max - min || 1) * padding;
  return [min - margin, max + margin];
}
