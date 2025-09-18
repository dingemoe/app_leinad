// ==UserScript==
// @name         Leinad App Render Autoload
// @namespace    https://github.com/dingemoe/app_leinad
// @version      1.1
// @description  Shadow DOM UI med CDN og dynamisk styling via leinad_app_render-klassen
// @author       Daniel
// @match        *://*/*
// @grant        none
// @require      https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/render.js
// ==/UserScript==


(function() {
    function runLeinadAppRender() {
        const layout = new leinad_app_render();
        layout.elem(["cssbear", "style"]);
        layout.elem(["container-root", "div"]);
        layout.render([
            ["app_leinad_wrap", {
                width: "400px",
                height: "auto",
                background: "rgba(20,20,20,0.9)",
                borderRadius: "8px"
            }],
            ["container-root", [
                "<h1 class='text-xl'>Hei Daniel 👋</h1>",
                "<p class='text-gray-300'>Dette er en isolert komponent med tilpasset stil.</p>"
            ]]
        ]);
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runLeinadAppRender);
    } else {
        runLeinadAppRender();
    }
})();
