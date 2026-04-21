import ar from "./ar";
import en from "./en";

export function getTranslations(lang) {
  return lang === "ar" ? ar : en;
}