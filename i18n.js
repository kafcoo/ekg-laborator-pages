import { english } from "./english.js";

function getLanguage() {
  if (typeof location === "undefined") return "cs";
  const requested = new URL(location.href).searchParams.get("lang");
  if (requested === "en" || requested === "cs") return requested;
  try {
    if (localStorage.getItem("ekg-language") === "en") return "en";
  } catch {}
  return "cs";
}

export const language = getLanguage();
export const numberLocale = language === "en" ? "en-US" : "cs-CZ";

const tag = /<\/?[a-z][a-z0-9:-]*(?:\s[^<>]*)?>|<\/?[a-z][a-z0-9:-]*(?:\s[^<>]*)?$/gi;
const textAttribute = /((?:aria-label|title|placeholder)=")([^"]+)"/g;

function translateText(text) {
  const key = text.trim().replace(/\s+/g, " ");
  return Object.hasOwn(english, key) ? text.replace(/\S[\s\S]*\S|\S/, () => english[key]) : text;
}

function translate(fragment) {
  // Only authored markup is translated. URLs, element IDs and live values are preserved.
  let result = "", offset = 0;
  for (const match of fragment.matchAll(tag)) {
    result += translateText(fragment.slice(offset, match.index));
    result += match[0].replace(textAttribute, (_, prefix, text) => prefix + translateText(text) + '"');
    offset = match.index + match[0].length;
  }
  return result + translateText(fragment.slice(offset));
}

export function t(message, ...values) {
  if (typeof message === "string") return language === "en" ? translate(message) : message;
  return message.reduce((text, part, i) => text + (i ? String(values[i - 1]) : "") + (language === "en" ? translate(part) : part), "");
}

export function setLanguage(next) {
  try { localStorage.setItem("ekg-language", next); } catch {}
  const url = new URL(location.href);
  url.searchParams.set("lang", next);
  if (url.hash === "#obsah") url.hash = "";
  location.replace(url);
}
