// classes/tracer.js
// Logger/Tracer for userscripts. Posts to Deno KV API.
// - Captures full GM_info object (snapshot) and stores it per location+@name (OVERWRITE).
// - Hooks console/error/unhandledrejection and stores latest per event (OVERWRITE).
// - Provides start(callback) so you can run your UI code cleanly.

(function (root) {
  class LeinadTracer {
    /**
     * @param {Object} opts
     * @param {string} opts.apiBase      Deno endpoint, e.g. "https://leinad-log.deno.dev"
     * @param {string} [opts.appName]    default name in KV; default GM_info.script.name || "leinad-app"
     * @param {string} [opts.location]   default location in KV; default location.hostname
     * @param {number} [opts.flushMs]    batch interval (ms), default 800
     * @param {boolean}[opts.hookConsole] hook console.*, default true
     * @param {boolean}[opts.hookErrors]  hook window errors, default true
     */
    constructor(opts = {}) {
      if (!opts.apiBase) throw new Error("LeinadTracer: apiBase må settes");
      this.apiBase = opts.apiBase.replace(/\/+$/, "");
      this.flushMs = typeof opts.flushMs === "number" ? opts.flushMs : 800;
      this.hookConsoleFlag = opts.hookConsole !== false;
      this.hookErrorsFlag = opts.hookErrors !== false;

      // Full GM_info snapshot (as JSON-safe)
      const gm = (typeof GM_info !== "undefined" && GM_info) ? safeClone(GM_info) : null;

      const scriptName = gm?.script?.name || "leinad-app";
      this.appName = opts.appName || scriptName;
      this.loc = opts.location || (typeof location !== "undefined" ? (location.hostname || "unknown") : "unknown");

      this.scriptMeta = gm?.script || null; // nice-to-have flattened
      this.gmFull = gm;                      // full GM_info snapshot

      this._q = [];
      this._timer = null;

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

    // ---- Public logging helpers (events/console) ----
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
     * Start tracer and run your callback after DOM is ready.
     * @param {(ctx:{ logEvent:Function, tracer:LeinadTracer, info:Object })=>void} callback
     */
    start(callback) {
      if (this.hookConsoleFlag) this._hookConsole();
      if (this.hookErrorsFlag) this._hookErrors();

      // Immediately queue GM snapshot (OVERWRITE server-side)
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

      // Flush when page is hidden/unloaded
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
        gm: this.gmFull,     // FULL GM object here
        script: this.scriptMeta,
        ua: (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      });
      if (!this._timer) this._timer = setTimeout(() => this.flush(false), this.flushMs);
    }

    _hookConsole() {
      if (this._consoleHooked) return;
      this._consoleHooked = true;

      const orig = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
      };
      console.log = (...args) => { try { this.log(...args); } catch {} orig.log(...args); };
      console.warn = (...args) => { try { this.warn(...args); } catch {} orig.warn(...args); };
      console.error = (...args) => { try { this.error(...args); } catch {} orig.error(...args); };
    }

    _hookErrors() {
      if (this._errorsHooked) return;
      this._errorsHooked = true;

      window.addEventListener("error", (ev) => {
        this._enqueue({ _mode: "event", _event: "window.error", level: "error",
          message: ev.message,
          stack: ev.error && ev.error.stack,
          filename: ev.filename, lineno: ev.lineno, colno: ev.colno,
          url: location.href });
      });

      window.addEventListener("unhandledrejection", (ev) => {
        const reason = ev.reason && (ev.reason.stack || ev.reason.message || String(ev.reason));
        this._enqueue({ _mode: "event", _event: "unhandledrejection", level: "error",
          reason, url: location.href });
      });
    }

    _enqueue(data) {
      // enrich with metadata
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

      // Map queue to server payloads (snapshot behavior)
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
        // default to event snapshot
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

      // Batch send (array). Server processes each and overwrites snapshots as needed.
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
        // On failure, push raw entries back (they'll be rewrapped next flush)
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
