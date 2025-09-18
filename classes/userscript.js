// ==UserScript==
// @name         Leinad App Render Autoload
// @namespace    https://github.com/dingemoe/app_leinad
// @version      1.4
// @description  Shadow DOM UI + snapshot-logging (GM + events) til Deno KV via tracer.js
// @author       Daniel
// @match        *://*/*
// @grant        unsafeWindow
// @require      https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/render.js
// @require      https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/tracer.js
// ==/UserScript==

(function () {
  const tracer = new LeinadTracer({
    apiBase: "https://leinad-log.deno.dev",
    flushMs: 800,
    // Om du fortsatt får “getter only”-feil før tracer.js er oppdatert:
    // hookConsole: false,
  });

  tracer.start(({ logEvent }) => {
    // Din UI-kode
    const layout = new leinad_app_render();
    layout.elem(["cssbear", "style"]);
    layout.elem(["container-root", "div"]);
    layout.render([
      [
        "app_leinad_wrap",
        {
          width: "400px",
          height: "auto",
          background: "rgba(20,20,20,0.9)",
          borderRadius: "8px",
        },
      ],
      [
        "container-root",
        [
          "<h1 class='text-xl'>Hei Daniel 👋</h1>",
          "<p class='text-gray-300'>Dette er en isolert komponent med tilpasset stil.</p>",
        ],
      ],
    ]);

    logEvent("app_ready");
  });
})();
