// classes/theme.js

/** Internt theme-register */
const THEMES = new Map();
/** Callbacks når et nytt theme blir registrert (for html.js til å hekte metoder) */
const SUBS = new Set();
/** Default theme-navn (kan settes/endres) */
let DEFAULT_THEME = "light";

/** Hjelpere */
const uniqJoin = (a, b) => {
  const aa = (a || "").trim().split(/\s+/).filter(Boolean);
  const bb = (b || "").trim().split(/\s+/).filter(Boolean);
  const set = new Set([...aa, ...bb]);
  return Array.from(set).join(" ");
};

/** Registrer/oppdater et theme */
export function registerTheme(name, spec) {
  // spec: { classes?: { "*": "...", div: "...", table: "...", ... },
  //         attrs?:   { "*": {...}, div: {...}, ... } }
  THEMES.set(name, spec || {});
  // ping abonnenter (html.js) så den kan lage .<themeName>()-metoder
  SUBS.forEach((cb) => {
    try { cb(name); } catch {}
  });
  return name;
}

/** Hent theme */
export function getTheme(name) {
  return THEMES.get(name);
}

/** Liste over alle themes (as plain object of names) */
export function getThemes() {
  return Array.from(THEMES.keys());
}

/** Abonner på registrering av nye themes */
export function onThemeRegistered(cb) {
  SUBS.add(cb);
  return () => SUBS.delete(cb);
}

/** Default theme API */
export function setDefaultTheme(name) { DEFAULT_THEME = name; }
export function getDefaultTheme() { return DEFAULT_THEME; }

/** Slå sammen props iht. theme-spesifikasjon */
export function applyThemeProps(tag, props, themeName) {
  const t = getTheme(themeName);
  if (!t) return props;
  const out = { ...(props || {}) };

  const classAny  = t.classes?.["*"] || "";
  const classTag  = t.classes?.[tag] || "";
  const attrsAny  = t.attrs?.["*"]   || {};
  const attrsTag  = t.attrs?.[tag]   || {};

  // merge classes unikt
  const merged = uniqJoin(classAny, classTag);
  if (merged) out.className = uniqJoin(out.className || "", merged);

  // merge attrs (tag overstyrer *)
  Object.assign(out, attrsAny, attrsTag, out);

  return out;
}

/* ---------------------------
   Innebygde themes
   --------------------------- */

// LIGHT (nøytral, “app”-stil)
registerTheme("light", {
  classes: {
    "*": "text-slate-900",
    div: "selection:bg-slate-200/50",
    table: "w-full border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm",
    thead: "bg-slate-100",
    th: "border border-slate-200 px-4 py-2 text-left font-semibold",
    td: "border border-slate-200 px-4 py-2",
    h1: "text-3xl font-bold",
    h2: "text-xl font-semibold mt-8",
    p:  "text-slate-600",
    input: "mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200",
    button: "inline-block rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800",
  },
});

// DRACULA (dark)
registerTheme("dracula", {
  classes: {
    "*": "text-[#f8f8f2]",
    div: "bg-[#282a36]",
    table: "w-full rounded-xl overflow-hidden shadow ring-1 ring-black/10",
    thead: "bg-[#44475a]",
    th: "px-4 py-2 text-left font-semibold",
    td: "px-4 py-2 border-t border-[#44475a]",
    h1: "text-3xl font-bold",
    h2: "text-xl font-semibold mt-8",
    p:  "text-[#bd93f9]",
    input: "mt-1 w-full rounded border border-[#44475a] bg-[#282a36] text-[#f8f8f2] px-3 py-2 focus:outline-none focus:ring focus:ring-[#6272a4]/40",
    button: "inline-block rounded-xl bg-[#50fa7b] text-[#282a36] px-4 py-2 hover:bg-[#40e06b]",
  },
  attrs: {
    "*": { },
    div: { },
  }
});

// Sett standard-theme (kan endres fra app: setDefaultTheme('dracula'))
setDefaultTheme("light");
