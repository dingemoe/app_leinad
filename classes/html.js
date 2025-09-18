import React from "https://esm.sh/react@18.3.1";

/** 🔧 Superklasse */
export class El {
  tag; props = {}; children = []; _ready = null;

  constructor(tag) {
    this.tag = tag;
  }

  id(id) { this.props.id = id; return this; }
  className(cls) { this.props.className = cls; return this; }
  attr(name, value) { this.props[name] = value; return this; }
  text(txt) { this.children.push(txt); return this; }

  content(children) {
    this.children.push(...children);
    return this;
  }

  repeat(arr, fn) {
    arr.forEach((item, i) => {
      const child = fn(item, i);
      this.children.push(child instanceof El ? child.build() : child);
    });
    return this;
  }

  build() {
    return React.createElement(
      this.tag,
      this.props,
      ...this.children.map(c => c instanceof El ? c.build() : c)
    );
  }

  valueOf() { return this.build(); }
  toString() { return this.build(); }
}

/** 🔧 Helpers for async datasources */
async function resolveSource(source, param) {
  if (typeof source === "string") {
    const res = await fetch(source);
    return res.json();
  }
  if (typeof source === "function") {
    const result = param !== undefined ? source(param) : source();
    return result instanceof Promise ? await result : result;
  }
  if (Array.isArray(source) || typeof source === "object") {
    return source;
  }
  return [];
}

/** 🔧 Table body med fetch */
export class Tbody extends El {
  constructor(source, paramOrFn, maybeFn) {
    super("tbody");
    if (!source) return;

    if (typeof paramOrFn === "function") {
      this._ready = this._fetch(source, undefined, paramOrFn);
    } else if (
      typeof paramOrFn === "string" ||
      typeof paramOrFn === "object"
    ) {
      this._ready = this._fetch(source, paramOrFn, maybeFn);
    }
  }

  async _fetch(source, param, fn) {
    const data = await resolveSource(source, param);
    this.repeat(data, fn);
  }
}

/** 🔧 Form med submit + change */
export class Form extends El {
  constructor(source, fn) {
    super("form");
    if (source && fn) {
      this._ready = this._init(source, fn);
    }
  }

  async _init(source, fn) {
    const data = await resolveSource(source);
    const built = fn(data);
    if (Array.isArray(built)) {
      built.forEach(c => this.children.push(c instanceof El ? c.build() : c));
    } else if (built instanceof El) {
      this.children.push(built.build());
    }
  }

  submit(fn) {
    this.props.onSubmit = (e) => {
      e.preventDefault();
      fn(e);
    };
    return this;
  }

  change(fn) {
    this.props.onChange = (e) => fn(e);
    return this;
  }
}

/** 🔧 renderApp håndterer async */
export async function renderApp(app) {
  const rendered = app.render();
  if (rendered._ready) {
    await rendered._ready;
  }
  return rendered.build();
}

/** 🔧 Standard element-klasser */
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
export class Section extends El { constructor(){ super("section"); } }
export class Header extends El { constructor(){ super("header"); } }
export class Footer extends El { constructor(){ super("footer"); } }
export class Nav extends El { constructor(){ super("nav"); } }
export class Article extends El { constructor(){ super("article"); } }
export class Main extends El { constructor(){ super("main"); } }

/** 🔧 Factories */
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
export const input = () => new Input();
export const section = () => new Section();
export const header = () => new Header();
export const footer = () => new Footer();
export const nav = () => new Nav();
export const article = () => new Article();
export const main = () => new Main();
export const form = (source, fn) => new Form(source, fn);
