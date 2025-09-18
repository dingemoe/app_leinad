class leinad_app_render {
    static VERSION = "1.3.12";
    static MODIFIED_DATE = "2025-09-18";
    constructor() {
        console.log(`[leinad_app_render] v${leinad_app_render.VERSION} (modified ${leinad_app_render.MODIFIED_DATE})`);
        this.host = document.createElement("div");
        this.host.setAttribute("id", "leinad_app_host");
        this.shadow = this.host.attachShadow({ mode: "open" });

        this.wrap = document.createElement("div");
        this.wrap.setAttribute("id", "app_leinad_wrap");
        this.applyDefaultStyles(this.wrap);

        this.elements = {
            head: [],
            body: []
        };

        this.CDN_REGISTRY = {
    "jquery": "https://code.jquery.com/jquery-3.6.0.min.js",
    "vue": "https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js",
    "react": "https://unpkg.com/react@18/umd/react.production.min.js",
    "beercss": "https://cdn.jsdelivr.net/npm/beercss@3.12.7/dist/cdn/beer.min.css",
    "beerjs": "https://cdn.jsdelivr.net/npm/beercss@3.12.7/dist/cdn/beer.min.js",
    "csstailwind": "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
        };

        // Plugin registry - definerer hvilke elementer hver plugin trenger
        this.PLUGIN_REGISTRY = {
            "beer": [
                ["beercss", "style"],
                ["beerjs", "script"]
            ],
            "tailwind": [
                ["csstailwind", "style"]
            ],
            "jquery": [
                ["jquery", "script"]
            ],
            "vue": [
                ["vue", "script"]
            ],
            "react": [
                ["react", "script"]
            ]
        };
    }

    // Setter default stil på wrapper
    applyDefaultStyles(elem) {
        Object.assign(elem.style, {
            position: "fixed",
            bottom: "0",
            left: "0",
            zIndex: "9999",
            width: "300px",
            height: "300px",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            overflow: "auto",
            fontFamily: "sans-serif",
            padding: "1rem"
        });
    }

    // ===== CDN REGISTRY CRUD METHODS =====
    
    // CREATE/UPDATE CDN resource
    setCdnResource(name, url) {
        if (!name || !url) {
            console.warn("setCdnResource: name og url er påkrevd");
            return false;
        }
        
        if (!this.isValidURL(url)) {
            console.warn(`setCdnResource: Ugyldig URL: ${url}`);
            return false;
        }
        
        this.CDN_REGISTRY[name] = url;
        console.log(`CDN resource '${name}' lagt til/oppdatert: ${url}`);
        return true;
    }
    
    // READ CDN resource
    getCdnResource(name) {
        return this.CDN_REGISTRY[name] || null;
    }
    
    // READ all CDN resources
    getAllCdnResources() {
        return { ...this.CDN_REGISTRY };
    }
    
    // DELETE CDN resource
    deleteCdnResource(name) {
        if (this.CDN_REGISTRY[name]) {
            delete this.CDN_REGISTRY[name];
            console.log(`CDN resource '${name}' slettet`);
            return true;
        }
        console.warn(`CDN resource '${name}' ikke funnet`);
        return false;
    }

    // ===== PLUGIN REGISTRY CRUD METHODS =====
    
    // CREATE/UPDATE plugin
    setPlugin(name, elements) {
        if (!name || !Array.isArray(elements)) {
            console.warn("setPlugin: name må være string, elements må være array");
            return false;
        }
        
        // Valider at alle elementer i plugin eksisterer i CDN_REGISTRY
        const missingResources = [];
        elements.forEach(([resourceName, type]) => {
            if (!this.CDN_REGISTRY[resourceName]) {
                missingResources.push(resourceName);
            }
        });
        
        if (missingResources.length > 0) {
            console.warn(`setPlugin: Følgende CDN ressurser mangler: ${missingResources.join(", ")}`);
            console.warn("Legg til CDN ressursene først med setCdnResource()");
            return false;
        }
        
        this.PLUGIN_REGISTRY[name] = elements;
        console.log(`Plugin '${name}' lagt til/oppdatert med ${elements.length} elementer`);
        return true;
    }
    
    // READ plugin
    getPlugin(name) {
        return this.PLUGIN_REGISTRY[name] || null;
    }
    
    // READ all plugins
    getAllPlugins() {
        return { ...this.PLUGIN_REGISTRY };
    }
    
    // DELETE plugin
    deletePlugin(name) {
        if (this.PLUGIN_REGISTRY[name]) {
            delete this.PLUGIN_REGISTRY[name];
            console.log(`Plugin '${name}' slettet`);
            return true;
        }
        console.warn(`Plugin '${name}' ikke funnet`);
        return false;
    }

    // ===== HELPER METHODS FOR REGISTRY MANAGEMENT =====
    
    // Bulk import CDN resources
    importCdnResources(resources) {
        if (typeof resources !== 'object') {
            console.warn("importCdnResources: resources må være et objekt");
            return false;
        }
        
        let imported = 0;
        Object.entries(resources).forEach(([name, url]) => {
            if (this.setCdnResource(name, url)) {
                imported++;
            }
        });
        
        console.log(`Importerte ${imported}/${Object.keys(resources).length} CDN ressurser`);
        return imported;
    }
    
    // Bulk import plugins
    importPlugins(plugins) {
        if (typeof plugins !== 'object') {
            console.warn("importPlugins: plugins må være et objekt");
            return false;
        }
        
        let imported = 0;
        Object.entries(plugins).forEach(([name, elements]) => {
            if (this.setPlugin(name, elements)) {
                imported++;
            }
        });
        
        console.log(`Importerte ${imported}/${Object.keys(plugins).length} plugins`);
        return imported;
    }
    
    // List all available resources and plugins
    listAll() {
        console.group("🔗 CDN Resources:");
        Object.entries(this.CDN_REGISTRY).forEach(([name, url]) => {
            console.log(`  ${name}: ${url}`);
        });
        console.groupEnd();
        
        console.group("🔌 Plugins:");
        Object.entries(this.PLUGIN_REGISTRY).forEach(([name, elements]) => {
            console.log(`  ${name}:`, elements);
        });
        console.groupEnd();
        
        return {
            cdn: this.getAllCdnResources(),
            plugins: this.getAllPlugins()
        };
    }

    // Ny helper-metode for å registrere elementer
    elem([name, type]) {
        let elem;
        switch (type) {
            case "style":
                elem = document.createElement("link");
                elem.className = name;
                this.elements.head.push({ name, elem, type });
                break;
            case "script":
                elem = document.createElement("script");
                elem.className = name;
                this.elements.head.push({ name, elem, type });
                break;
            case "div":
            default:
                elem = document.createElement("div");
                elem.id = name;
                this.elements.body.push({ name, elem, type: "div" });
                break;
        }
        return elem;
    }

    // Plugin metode for å sette opp komplette plugin-pakker
    plugin(pluginName) {
        const pluginElements = this.PLUGIN_REGISTRY[pluginName];
        
        if (!pluginElements) {
            console.warn(`Plugin '${pluginName}' ikke funnet i PLUGIN_REGISTRY. Tilgjengelige plugins:`, Object.keys(this.PLUGIN_REGISTRY));
            return false;
        }

        console.log(`Loading plugin: ${pluginName}`);
        pluginElements.forEach(([name, type]) => {
            this.elem([name, type]);
            console.log(`  - Added ${type}: ${name}`);
        });

        return true;
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    setAttributes(elem, attributes = {}) {
        Object.entries(attributes).forEach(([key, val]) => {
            elem.setAttribute(key, val);
        });
    }

    style(elem, config) {
        const fallbackHref = this.CDN_REGISTRY[this.extractKeyFromElement(elem)];
        const href = config.href || fallbackHref;

        if (href && this.isValidURL(href)) {
            elem.setAttribute("rel", "stylesheet");
            elem.setAttribute("href", href);
            elem.onerror = () => {
                console.warn(`Style feilet: ${href}`);
            };
        } else if (config.body) {
            Object.entries(config.body).forEach(([key, val]) => {
                elem.style[key] = val;
            });
        }

        this.setAttributes(elem, config.attributes);
    }

    script(elem, config) {
        const fallbackSrc = this.CDN_REGISTRY[this.extractKeyFromElement(elem)];
        const src = config.src || fallbackSrc;

        if (src && this.isValidURL(src)) {
            elem.setAttribute("src", src);
            elem.onerror = () => {
                console.warn(`Script feilet: ${src}`);
            };
        } else if (config.code) {
            elem.textContent = config.code;
        }

        this.setAttributes(elem, config.attributes);
    }

    extractKeyFromElement(elem) {
        return elem.getAttribute("class") || "";
    }

    html(elem, htmlArray) {
        elem.innerHTML = htmlArray.join("");
    }

    render(configs = []) {
        const allNames = configs.map(([name]) => name);
        [...this.elements.head].forEach(({ name }) => {
            if (!allNames.includes(name) && this.CDN_REGISTRY[name]) {
                configs.unshift([name, {}]);
            }
        });

        for (const [name, set] of configs) {
            const match = [...this.elements.head, ...this.elements.body].find(e => e.name === name);
            if (!match) {
                console.warn(`Fant ikke element med navn: ${name}`);
                continue;
            }

            const { elem, type } = match;

            try {
                if (type === "style") {
                    this.style(elem, set);
                } else if (type === "script") {
                    this.script(elem, set);
                } else if (Array.isArray(set)) {
                    this.html(elem, set);
                } else if (type === "div" && name === "app_leinad_wrap" && typeof set === "object") {
                    Object.entries(set).forEach(([key, val]) => {
                        this.wrap.style[key] = val;
                    });
                }
            } catch (err) {
                console.error("Feil under rendering:", err);
            }
        }

        [...this.elements.head, ...this.elements.body].forEach(({ elem }) => {
            this.wrap.appendChild(elem);
        });

        this.shadow.appendChild(this.wrap);
        document.body.appendChild(this.host);

        return this.shadow;
    }
}
