// classes/html.js
import React from "https://esm.sh/react@18.3.1";
import {
  applyThemeProps,
  getDefaultTheme,
  getThemes,
  onThemeRegistered,
} from "./theme.js";

/* ===== Base & utilities ===== */

export class El {
  tag; props = {}; children = []; _ready = null; _theme = null;

  constructor(tag) { this.tag = tag; }

  id(id) { this.props.id = id; return this; }
  className(cls) { this.props.className = cls; return this; }
  attr(name, value) { this.props[name] = value; return this; }
  text(txt) { this.children.push(txt); return this; }

  content(children) {
    const kids = children || [];
    for (const c of kids) {
      if (c instanceof El) {
        if (!c._theme) c._theme = this._theme || c._theme || null;
      }
      this.children.push(c);
    }
    return this;
  }

  theme(name) { this._theme = name; return this; }

  build() {
    const themeName = this._theme || getDefaultTheme();
    const builtChildren = this.children.map((c) =>
      c instanceof El ? c.build()
      : (c && c.tag && c.props)
        ? React.createElement(c.tag, c.props, ...(c.children ?? []))
        : c
    );
    const themedProps = themeName ? applyThemeProps(this.tag, this.props, themeName) : this.props;
    return React.createElement(this.tag, themedProps, ...builtChildren);
  }
}

async function awaitAll(el) {
  if (!el) return;
  if (el instanceof Promise) el = await el;

  if (el && typeof el === "object" && "_ready" in el && el._ready) {
    try { await el._ready; } finally { el._ready = null; }
  }

  if (el && Array.isArray(el.children)) {
    for (const c of el.children) {
      if (c instanceof El) {
        if (!c._theme) c._theme = el._theme || c._theme || null;
        await awaitAll(c);
      }
    }
  }
}

export async function renderApp(appInstance) {
  const root = appInstance.render();
  if (!root._theme) root._theme = getDefaultTheme();
  await awaitAll(root);
  return root.build();
}

/* ===== Async helpers ===== */

async function resolveSource(source, param) {
  if (typeof source === "string") {
    const res = await fetch(source);
    return res.json();
  }
  if (typeof source === "function") {
    const r = param !== undefined ? source(param) : source();
    return r instanceof Promise ? await r : r;
  }
  if (Array.isArray(source) || typeof source === "object") return source;
  return [];
}

/* ===== Special components ===== */

export class Tbody extends El {
  constructor(source, paramOrFn, maybeFn) {
    super("tbody");
    if (!source) return;

    if (typeof paramOrFn === "function") {
      this._ready = this._fetch(source, undefined, paramOrFn);
    } else if (typeof paramOrFn === "string" || typeof paramOrFn === "object") {
      this._ready = this._fetch(source, paramOrFn, maybeFn);
    } else if (paramOrFn == null) {
      this._ready = this._fetch(source, undefined, (row) => row);
    }
  }

  async _fetch(source, param, fn) {
    const data = await resolveSource(source, param);

    // Ikke bruk this.repeat (kan skygge i enkelte miljøer) – push direkte:
    if (Array.isArray(data)) {
      data.forEach((item, i) => {
        const row = fn(item, i);
        this.children.push(row instanceof El ? row : row);
      });
    } else if (data && typeof data === "object") {
      const row = fn(data, 0);
      this.children.push(row instanceof El ? row : row);
    }
  }
}

export class Form extends El {
  constructor(source, builderFn) {
    super("form");
    if (source && builderFn) {
      this._ready = this._init(source, builderFn);
    }
  }

  async _init(source, builderFn) {
    const data = await resolveSource(source);
    const built = builderFn(data);
    if (Array.isArray(built)) {
      built.forEach((c) => this.children.push(c instanceof El ? c : c));
    } else if (built instanceof El) {
      this.children.push(built);
    }
  }

  static _snapshot(formEl) {
    try { return Object.fromEntries(new FormData(formEl)); }
    catch { return {}; }
  }

  submit(fn) {
    this.props.onSubmit = (e) => {
      e.preventDefault?.();
      const formEl =
        (e.target && e.target.tagName === "FORM") ? e.target :
        (e.currentTarget && e.currentTarget.tagName === "FORM") ? e.currentTarget : null;

      const data = formEl ? Form._snapshot(formEl) : {};
      e.data = data;
      e.json = () => JSON.stringify(Form._snapshot(formEl));

      if (fn.length >= 2) fn(data, e);
      else fn(e);
    };
    return this;
  }

  change(fn) {
    this.props.onChange = (e) => {
      const t = e.target || e.srcElement;
      const formEl = (t && t.form) || null;

      const data = formEl ? Form._snapshot(formEl) : {};
      e.data = data;
      e.json = () => JSON.stringify(Form._snapshot(formEl));
      e.name = t?.name;
      e.value = t?.value;
      e.form = formEl;

      if (fn.length >= 2) fn(data, e);
      else fn(e);
    };
    return this;
  }
}

/* ===== Element classes ===== */

export class Div extends El { constructor(){ super("div"); } }
export class Span extends El { constructor(){ super("span"); } }
export class H1 extends El { constructor(){ super("h1"); } }
export class H2 extends El { constructor(){ super("h2"); } }
export class H3 extends El { constructor(){ super("h3"); } }
export class P extends El { constructor(){ super("p"); } }
export class A extends El { constructor(){ super("a"); } }
export class Button extends El { constructor(){ super("button"); } }
export class Ul extends El { constructor(){ super("ul"); } }
export class Li extends El { constructor(){ super("li"); } }
export class Table extends El { constructor(){ super("table"); } }
export class Thead extends El { constructor(){ super("thead"); } }
export class Tr extends El { constructor(){ super("tr"); } }
export class Td extends El { constructor(){ super("td"); } }
export class Th extends El { constructor(){ super("th"); } }
export class Input extends El { constructor(){ super("input"); } }
export class Label extends El { constructor(){ super("label"); } }
export class Section extends El { constructor(){ super("section"); } }
export class Header extends El { constructor(){ super("header"); } }
export class Footer extends El { constructor(){ super("footer"); } }
export class Nav extends El { constructor(){ super("nav"); } }
export class Article extends El { constructor(){ super("article"); } }
export class Main extends El { constructor(){ super("main"); } }
export class Img extends El { constructor(){ super("img"); } }
export class Tfoot extends El { constructor(){ super("tfoot"); } }

/* ===== Factories ===== */

export const div = () => new Div();
export const span = () => new Span();
export const h1 = () => new H1();
export const h2 = () => new H2();
export const h3 = () => new H3();
export const p = () => new P();
export const a = () => new A();
export const button = () => new Button();
export const ul = () => new Ul();
export const li = () => new Li();
export const table = () => new Table();
export const thead = () => new Thead();
export const tbody = (source, paramOrFn, maybeFn) => new Tbody(source, paramOrFn, maybeFn);
export const tr = () => new Tr();
export const td = () => new Td();
export const th = () => new Th();
export const tfoot = () => new Tfoot();
export const input = () => new Input();
export const label = () => new Label();
export const section = () => new Section();
export const header = () => new Header();
export const footer = () => new Footer();
export const nav = () => new Nav();
export const article = () => new Article();
export const main = () => new Main();
export const img = () => new Img();
export const form = (source, builderFn) => new Form(source, builderFn);

/* ===== Theme method injection ===== */

function installThemeMethod(name) {
  if (!name || El.prototype[name]) return;
  Object.defineProperty(El.prototype, name, {
    value: function() { return this.theme(name); },
    enumerable: false,
  });
}
getThemes().forEach(installThemeMethod);
onThemeRegistered((name) => installThemeMethod(name));
