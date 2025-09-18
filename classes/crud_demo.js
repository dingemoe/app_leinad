// ==UserScript==
// @name         Leinad CRUD Demo
// @namespace    https://github.com/dingemoe/app_leinad
// @version      1.0
// @description  Demonstrerer CRUD-funksjonalitet for CDN resources og plugins
// @author       Daniel
// @match        *://*/*
// @grant        GM_info
// @require      https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/render.js
// ==/UserScript==

(function () {
    console.log("🚀 CRUD Demo starter...");
    
    const layout = new leinad_app_render();
    
    // ===== CDN RESOURCES CRUD DEMO =====
    console.log("\n📦 CDN Resources CRUD Demo:");
    
    // CREATE - Legg til nye CDN ressurser
    layout.setCdnResource("bootstrap", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css");
    layout.setCdnResource("bootstrapjs", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js");
    layout.setCdnResource("fontawesome", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css");
    layout.setCdnResource("chartjs", "https://cdn.jsdelivr.net/npm/chart.js");
    
    // READ - Hent spesifikke ressurser
    console.log("Bootstrap CSS:", layout.getCdnResource("bootstrap"));
    console.log("Chart.js:", layout.getCdnResource("chartjs"));
    
    // UPDATE - Oppdater eksisterende ressurs
    layout.setCdnResource("bootstrap", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css");
    console.log("Bootstrap oppdatert til nyere versjon");
    
    // ===== PLUGINS CRUD DEMO =====
    console.log("\n🔌 Plugins CRUD Demo:");
    
    // CREATE - Opprett nye plugins
    layout.setPlugin("bootstrap", [
        ["bootstrap", "style"],
        ["bootstrapjs", "script"]
    ]);
    
    layout.setPlugin("icons_and_charts", [
        ["fontawesome", "style"],
        ["chartjs", "script"]
    ]);
    
    layout.setPlugin("full_ui", [
        ["beercss", "style"],
        ["beerjs", "script"],
        ["bootstrap", "style"],
        ["fontawesome", "style"]
    ]);
    
    // READ - Hent plugin konfigurasjon
    console.log("Bootstrap plugin:", layout.getPlugin("bootstrap"));
    console.log("Full UI plugin:", layout.getPlugin("full_ui"));
    
    // ===== BULK IMPORT DEMO =====
    console.log("\n📥 Bulk Import Demo:");
    
    // Bulk import av CDN ressurser
    const newResources = {
        "alpinejs": "https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js",
        "htmx": "https://unpkg.com/htmx.org@1.9.6",
        "animate": "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
    };
    layout.importCdnResources(newResources);
    
    // Bulk import av plugins
    const newPlugins = {
        "interactive": [
            ["alpinejs", "script"],
            ["htmx", "script"]
        ],
        "animations": [
            ["animate", "style"]
        ]
    };
    layout.importPlugins(newPlugins);
    
    // ===== LIST ALL DEMO =====
    console.log("\n📋 Full oversikt:");
    const all = layout.listAll();
    
    // ===== DELETE DEMO =====
    console.log("\n🗑️ Delete Demo:");
    layout.deleteCdnResource("chartjs");
    layout.deletePlugin("icons_and_charts");
    console.log("Slettet chartjs ressurs og icons_and_charts plugin");
    
    // ===== PRACTICAL USAGE DEMO =====
    console.log("\n🎯 Practical Usage Demo:");
    
    // Bruk plugins for å sette opp UI
    layout.plugin("full_ui");        // Beer + Bootstrap + FontAwesome
    layout.plugin("interactive");    // Alpine.js + HTMX
    layout.plugin("animations");     // Animate.css
    
    layout.elem(["main-container", "div"]);
    
    layout.render([
        [
            "app_leinad_wrap",
            {
                width: "500px",
                height: "400px",
                background: "rgba(20,20,20,0.95)",
                borderRadius: "12px",
                border: "1px solid #333"
            },
        ],
        [
            "main-container",
            [
                "<h2 class='text-xl mb-4'><i class='fas fa-code'></i> CRUD Demo Complete!</h2>",
                "<div class='alert alert-success animate__animated animate__fadeIn'>",
                "  <strong>Success!</strong> Alle CRUD operasjoner fungerer perfekt.",
                "</div>",
                "<button class='btn btn-primary' onclick='console.log(\"Bootstrap button clicked!\")'>",
                "  <i class='fas fa-rocket'></i> Bootstrap Button",
                "</button>",
                "<button class='button round ml-2' onclick='console.log(\"Beer button clicked!\")'>",
                "  <i class='fas fa-beer'></i> Beer Button",
                "</button>",
                "<div class='mt-3'>",
                "  <small class='text-muted'>Både Bootstrap, BeerCSS, FontAwesome og animasjoner er aktive!</small>",
                "</div>"
            ],
        ],
    ]);
    
    console.log("✅ CRUD Demo fullført! Sjekk console for detaljer.");
})();