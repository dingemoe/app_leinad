// classes/tracer.js
// Logger/Tracer for userscripts. Posts to Deno KV API.
// - Lagrer FULL GM_info (snapshot) per location+@name (OVERWRITE).
// - Lagrer siste event per location+event (OVERWRITE).
// - Trygg console-hook: gjør INGEN override dersom metoden ikke er writable/configurable.
// - start(callback) lar deg kjøre UI-koden din enkelt.

(function (root) {
  class LeinadTracer {
    static VERSION = "1.3.9";
    static MODIFIED_DATE = "2025-09-18";
    
    /**
     * @param {Object} opts
     * @param {string} opts.apiBase      Deno endpoint, e.g. "https://leinad-log.deno.dev"
     * @param {string} [opts.appName]    default name; default GM_info.script.name || "leinad-app"
     * @param {string} [opts.location]   default location; default location.hostname
     * @param {number} [opts.flushMs]    batch interval (ms), default 800
     * @param {boolean}[opts.hookConsole] hook console.*, default true
     * @param {boolean}[opts.hookErrors]  hook window errors, default true
     */
    constructor(opts = {}) {
      console.log(`[Tracer] v${LeinadTracer.VERSION} (modified ${LeinadTracer.MODIFIED_DATE})`);
      if (!opts.apiBase) throw new Error("LeinadTracer: apiBase må settes");
      this.apiBase = opts.apiBase.replace(/\/+$/, "");
      this.flushMs = typeof opts.flushMs === "number" ? opts.flushMs : 800;
      this.hookConsoleFlag = opts.hookConsole !== false;
      this.hookErrorsFlag = opts.hookErrors !== false;

      // Full GM_info snapshot (gjør den JSON-safe)
      const gm = (typeof GM_info !== "undefined" && GM_info) ? safeClone(GM_info) : null;

      const scriptName = gm?.script?.name || "leinad-app";
      this.appName = opts.appName || scriptName;
      this.loc = opts.location || (typeof location !== "undefined" ? (location.hostname || "unknown") : "unknown");

      this.scriptMeta = gm?.script || null; // flatten  
      this.gmFull = gm;                      // full GM_info

      this._q = [];
      this._timer = null;

      // Full GM_info snapshot (gjør den JSON-safe)
//       const gm = (typeof GM_info !== "undefined" && GM_info) ? safeClone(GM_info) : null;
// 
//       const scriptName = gm?.script?.name || "leinad-app";
//       this.appName = opts.appName || scriptName;
//       this.loc = opts.location || (typeof location !== "undefined" ? (location.hostname || "unknown") : "unknown");
// 
//       this.scriptMeta = gm?.script || null; // flatten
//       this.gmFull = gm;                      // full GM_info
// 
//       this._q = [];
//       this._timer = null;
// 
      this.logEvent = this.logEvent.bind(this);
      this.log = this.log.bind(this);
      this.warn = this.warn.bind(this);
      this.error = this.error.bind(this);
      this.flush = this.flush.bind(this);
    }

    info() {
      return {
        appName: this.appName,
        location: this.loc,
        script: this.scriptMeta,
        gm: this.gmFull,
      };
    }

    // ---- Public logging helpers ----
    logEvent(eventName, details = {}) {
      this._enqueue({
        _mode: "event",
        _event: String(eventName),
        level: "event",
        details,
        url: (typeof location !== "undefined" ? location.href : undefined),
      });
    }
    log(...args)   { this._enqueue({ _mode: "event", _event: "console.log",   level: "log",   args, url: location.href }); }
    warn(...args)  { this._enqueue({ _mode: "event", _event: "console.warn",  level: "warn",  args, url: location.href }); }
    error(...args) { this._enqueue({ _mode: "event", _event: "console.error", level: "error", args, url: location.href }); }

    /**
     * Start tracer og kjør callback når DOM er klar
     * @param {(ctx:{ logEvent:Function, tracer:LeinadTracer, info:Object })=>void} callback
     */
    start(callback) {
      if (this.hookConsoleFlag) {
        try {
          const ok = this._hookConsole();
          if (!ok) {
            // kan ikke hooke — slå av så vi ikke prøver igjen
            this.hookConsoleFlag = false;
          }
        } catch {
          this.hookConsoleFlag = false;
        }
      }
      if (this.hookErrorsFlag) this._hookErrors();

      // Kø FULL GM snapshot (server overskriver på gm-key)
      this._enqueueGM();

      const run = () => {
        try {
          callback?.({ logEvent: this.logEvent, tracer: this, info: this.info() });
          this.logEvent("userscript_loaded", { script: this.scriptMeta });
        } catch (e) {
          this._enqueue({ _mode: "event", _event: "callback_error", level: "error", message: String(e), stack: e?.stack });
        }
      };

      if (typeof document !== "undefined" && document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run, { once: true });
      } else {
        run();
      }

      // Flush ved skjuling/lukking
      if (typeof window !== "undefined") {
        window.addEventListener("pagehide", () => this.flush(true));
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") this.flush(true);
        });
      }
    }

    // ---- internals ----
    _enqueueGM() {
      this._q.push({
        _mode: "gm",
        gm: this.gmFull,     // FULL GM objekt
        script: this.scriptMeta,
        ua: (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      });
      if (!this._timer) this._timer = setTimeout(() => this.flush(false), this.flushMs);
    }

    /**
     * Returnerer true dersom minst én console-metode ble hooket trygt.
     * Ingen exceptions blir bubbla ut; metoder som ikke er writable/configurable hoppes over.
     */
    _hookConsole() {
      if (this._consoleHooked) return true;
      this._consoleHooked = true;

      const canOverride = (obj, prop) => {
        if (!obj) return false;
        // sjekk både direkte og på prototype
        let d = Object.getOwnPropertyDescriptor(obj, prop);
        if (!d && obj.__proto__) d = Object.getOwnPropertyDescriptor(obj.__proto__, prop);
        if (!d) return false;
        return !!(d.writable || d.configurable || d.set);
      };

      // Prøv i rekkefølge: unsafeWindow.console -> window.console -> console
      const candidates = [];
      try { if (typeof unsafeWindow !== "undefined" && unsafeWindow.console) candidates.push(unsafeWindow.console); } catch {}
      try { if (typeof window !== "undefined" && window.console) candidates.push(window.console); } catch {}
      if (typeof console !== "undefined") candidates.push(console);

      let target = null;
      for (const c of candidates) {
        // velg første der minst én av metodene er overridebar
        if (["log","warn","error"].some(m => canOverride(c, m))) {
          target = c;
          break;
        }
      }
      if (!target) return false; // ingen trygg hook mulig i miljøet

      const bound = (fn) => (fn && fn.bind ? fn.bind(target) : fn);

      let hookedAny = false;
      const tryBind = (name) => {
        try {
          const descSelf  = Object.getOwnPropertyDescriptor(target, name);
          const descProto = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target) || {}, name);
          const desc = descSelf || descProto;
          if (!desc) return false;

          const orig = bound(target[name]);
          if (typeof orig !== "function") return false;

          const wrapper = (...args) => {
            try {
              this._enqueue({ _mode: "event", _event: `console.${name}`, level: name, args, url: location.href, ua: navigator.userAgent });
            } catch {}
            return orig(...args);
          };

          if (desc.configurable) {
            Object.defineProperty(target, name, { value: wrapper, writable: !!desc.writable, configurable: true });
            hookedAny = true; return true;
          }
          if (desc.writable) {
            target[name] = wrapper;
            hookedAny = true; return true;
          }
          // Ikke writable/configurable → hopp over, ikke kast
          return false;
        } catch {
          return false;
        }
      };

      ["log","warn","error"].forEach(tryBind);
      return hookedAny;
    }

    _hookErrors() {
      if (this._errorsHooked) return;
      this._errorsHooked = true;

      window.addEventListener("error", (ev) => {
        this._enqueue({ _mode: "event", _event: "window.error", level: "error",
          message: ev.message, stack: ev.error && ev.error.stack,
          filename: ev.filename, lineno: ev.lineno, colno: ev.colno, url: location.href });
      });

      window.addEventListener("unhandledrejection", (ev) => {
        const reason = ev.reason && (ev.reason.stack || ev.reason.message || String(ev.reason));
        this._enqueue({ _mode: "event", _event: "unhandledrejection", level: "error",
          reason, url: location.href });
      });
    }

    _enqueue(data) {
      const enriched = {
        ...data,
        script: this.scriptMeta || undefined,
        ua: data.ua || (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      };
      this._q.push(enriched);
      if (!this._timer) this._timer = setTimeout(() => this.flush(false), this.flushMs);
    }

    async flush(useBeacon = false) {
      if (!this._q.length) return;

      const nowISO = new Date().toISOString();
      const payloads = this._q.splice(0, this._q.length).map((d) => {
        if (d._mode === "gm") {
          return {
            mode: "gm",
            name: this.appName,
            location: this.loc,
            datetime: nowISO,
            data: { gm: d.gm, script: d.script, ua: d.ua },
          };
        }
        const eventName = String(d._event || "custom.event");
        return {
            mode: "event",
            event: eventName,
            name: this.appName,
            location: this.loc,
            datetime: nowISO,
            data: d,
        };
      });

      try {
        if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payloads)], { type: "application/json" });
          navigator.sendBeacon(`${this.apiBase}/items`, blob);
        } else {
          await fetch(`${this.apiBase}/items`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payloads),
          });
        }
      } catch (e) {
        // legg tilbake for retry
        payloads.forEach((p) => {
          if (p.mode === "gm") this._q.push({ _mode: "gm", gm: p.data?.gm, script: p.data?.script, ua: p.data?.ua });
          else this._q.push({ _mode: "event", _event: p.event, ...p.data });
        });
      } finally {
        clearTimeout(this._timer);
        this._timer = null;
      }
    }
  }

  function safeClone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); }
    catch { return obj; }
  }

  root.LeinadTracer = LeinadTracer;
})(typeof unsafeWindow !== "undefined" ? unsafeWindow : window);
