class leinad_app_render {
    constructor() {
        this.wrap = document.createElement("div");
        this.wrap.setAttribute("id", "app_leinad_wrap");

        this.elements = {
            head: [],  // style og script
            body: []   // div, section, etc.
        };

        this.CDN_REGISTRY = {
            jquery: "https://code.jquery.com/jquery-3.6.0.min.js",
            vue: "https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js",
            react: "https://unpkg.com/react@18/umd/react.production.min.js",
            cssbear: "https://cdn.jsdelivr.net/npm/beercss@3.12.7/+esm",
            csstailwind: "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
        };
    }

    // Oppretter og lagrer et nytt element
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

    // Validerer URL
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Setter attributter
    setAttributes(elem, attributes = {}) {
        Object.entries(attributes).forEach(([key, val]) => {
            elem.setAttribute(key, val);
        });
    }

    // Setter CSS via href eller inline
    style(elem, config) {
        if (config.href) {
            if (!this.isValidURL(config.href)) {
                console.warn(`Ugyldig href: ${config.href}`);
                return;
            }
            elem.setAttribute("rel", "stylesheet");
            elem.setAttribute("href", config.href);

            // Fallback hvis href feiler
            elem.onerror = () => {
                const key = this.extractKeyFromURL(config.href);
                const fallback = this.CDN_REGISTRY[key];
                if (fallback) {
                    console.warn(`Style feilet: ${config.href}. Foreslår CDN: ${fallback}`);
                    const altLink = document.createElement("link");
                    altLink.rel = "stylesheet";
                    altLink.href = fallback;
                    document.head.appendChild(altLink);
                } else {
                    console.error(`Ingen fallback-CDN funnet for nøkkel: ${key}`);
                }
            };
        } else if (config.body) {
            Object.entries(config.body).forEach(([key, val]) => {
                elem.style[key] = val;
            });
        }
        this.setAttributes(elem, config.attributes);
    }

    // Setter script via src eller inline, med fallback
    script(elem, config) {
        if (config.src) {
            if (!this.isValidURL(config.src)) {
                console.warn(`Ugyldig src: ${config.src}`);
                return;
            }

            elem.setAttribute("src", config.src);

            // Fallback hvis src feiler
            elem.onerror = () => {
                const key = this.extractKeyFromURL(config.src);
                const fallback = this.CDN_REGISTRY[key];
                if (fallback) {
                    console.warn(`Script feilet: ${config.src}. Foreslår CDN: ${fallback}`);
                    const altScript = document.createElement("script");
                    altScript.src = fallback;
                    altScript.async = true;
                    document.head.appendChild(altScript);
                } else {
                    console.error(`Ingen fallback-CDN funnet for nøkkel: ${key}`);
                }
            };
        } else if (config.code) {
            elem.textContent = config.code;
        }

        this.setAttributes(elem, config.attributes);
    }

    // Trekker ut nøkkel fra URL for CDN-oppslag
    extractKeyFromURL(url) {
        try {
            const parts = new URL(url).pathname.split("/");
            return parts.find(part => Object.keys(this.CDN_REGISTRY).includes(part)) || "";
        } catch {
            return "";
        }
    }

    // Setter HTML-innhold
    html(elem, htmlArray) {
        elem.innerHTML = htmlArray.join("");
    }

    // Hovedrender-funksjon
    render(configs = []) {
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
                }
            } catch (err) {
                console.error("Feil under rendering:", err);
            }
        });

        // Legg til style og script først
        [...this.elements.head, ...this.elements.body].forEach(({ elem }) => {
            this.wrap.appendChild(elem);
        });

        return this.wrap;
    }
}
