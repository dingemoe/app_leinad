// ==UserScript==
// @name         Leinad App Render Autoload
// @namespace    https://github.com/dingemoe/app_leinad
// @version      1.4
// @description  Shadow DOM UI + snapshot-logging (GM + events) til Deno KV via tracer.js
// @author       Daniel
// @match        *://*/*
// @grant        GM_info
// @grant        unsafeWindow
// @require      https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/render.js
// @require      https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/tracer.js
// ==/UserScript==

/*

Aktiver denne hvis du fortsatt vil la tracer prøve sidekontekstens console:
// // @grant        unsafeWindow

*/

(function () {
    console.log("Start");
  const tracer = new LeinadTracer({
    apiBase: "https://leinad-log.deno.dev",
    flushMs: 800,
    // Hvis du vil tvinge av console-hook uansett:
    // hookConsole: false,
  });

  tracer.start(({ logEvent }) => {
       console.log("trace");
    // Din UI-kode
    try {
      const layout = new leinad_app_render();
       console.log(layout);
    layout.elem(["beercss", "style"]);
    layout.elem(["beerjs", "script"]);
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
    console.log("ready?",layout);
    logEvent("app_ready");
    } catch(err) {
        console.log("Catch error", err);
    }
  });
})();
