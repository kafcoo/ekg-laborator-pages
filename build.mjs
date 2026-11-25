import { cp, mkdir } from "node:fs/promises";

const files = [
  "index.html", "style.css", "app.js", "analysis.js",
  "labs.js", "lessons.js", "i18n.js", "english.js", "heart.js", "plot.js", "rhythms.js", "data",
];
await mkdir(new URL("./dist/", import.meta.url), { recursive: true });
for (const file of files) {
  await cp(new URL(file, import.meta.url), new URL("dist/" + file, import.meta.url), { recursive: true });
}
