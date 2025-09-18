class leinad_app_render {
    constructor() {
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

        this.CDN_REGISTRY = {};
        this._cdnRegistryLoaded = this.loadCDNRegistry();
    }

    async loadCDNRegistry() {
        try {
            const res = await fetch("/classes/cdn_registry.json");
            if (res.ok) {
                this.CDN_REGISTRY = await res.json();
            } else {
                console.warn("Kunne ikke laste cdn_registry.json, bruker tomt objekt.");
            }
        } catch (e) {
            console.error("Feil ved lasting av cdn_registry.json:", e);
        }
    }

    /**
     * Søk etter rammeverk i jsDelivr, unpkg og cdnjs parallelt
     * @param {string} lib Navn på rammeverk (f.eks. "vue")
     * @returns {Promise<object>} Resultater fra alle kilder
     */
    async cdn_lib(lib) {
        const jsdelivr = fetch(`https://data.jsdelivr.com/v1/packages/npm/${encodeURIComponent(lib)}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null);
        const unpkg = fetch(`https://unpkg.com/browse/${encodeURIComponent(lib)}/`)
            .then(r => r.ok ? r.text() : null)
            .catch(() => null);
        const cdnjs = fetch(`https://api.cdnjs.com/libraries?search=${encodeURIComponent(lib)}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null);

        const [jsdelivrRes, unpkgRes, cdnjsRes] = await Promise.all([jsdelivr, unpkg, cdnjs]);

        return {
            jsdelivr: jsdelivrRes,
            unpkg: unpkgRes,
            cdnjs: cdnjsRes
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
            padding: "1rem",
            margin: "0",
            padding: "0"
        });
    }

    // DOMContentLoaded callback
    onReady(callback) {
        window.addEventListener("DOMContentLoaded", () => callback(this));
    }

    elem([name, type]) {
        const element = document.createElement(type);
        element.setAttribute("class", name);
        const entry = { name, type, elem: element };

        if (type === "style" || type === "script") {
            this.elements.head.push(entry);
        } else {
            this.elements.body.push(entry);
        }
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

        configs.forEach(([name, set]) => {
            const match = [...this.elements.head, ...this.elements.body].find(e => e.name === name);
            if (!match) {
                console.warn(`Fant ikke element med navn: ${name}`);
                return;
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
        });

        [...this.elements.head, ...this.elements.body].forEach(({ elem }) => {
            this.wrap.appendChild(elem);
        });

        this.shadow.appendChild(this.wrap);
        document.body.appendChild(this.host);

        return this.shadow;
    }
}
