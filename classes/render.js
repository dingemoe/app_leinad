class leinad_app_render {
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

        this.CDN_REGISTRY = {
    "jquery": "https://code.jquery.com/jquery-3.6.0.min.js",
    "vue": "https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js",
    "react": "https://unpkg.com/react@18/umd/react.production.min.js",
    "cssbear": "https://cdn.jsdelivr.net/npm/beercss@3.12.7/+esm",
    "csstailwind": "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
        };

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
