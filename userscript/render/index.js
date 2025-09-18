(function() {
    const container = document.createElement('div');
    container.setAttribute("id", "leinad_app_root");
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.left = '0';
    container.style.zIndex = '999';
    container.style.margin = '0';
    container.style.padding = '0';
    document.body.appendChild(container);
   
    class leinad_app_render {
        constructor() {
            this.ides = ["id", "class" ];
            this.set = {};
            this.wrap = document.createElement("div");
            this.wrap.setAttribute("id", "app_leinad_wrap");
            this.elements = [];
        }
        elem(config = ["name", "type"]) {
            let prop = { name: config[0], type: config[1] }
            prop.elem = document.createElement(prop.type);
            prop.elem.setAttribute("class", prop.name);
            this.elements.push(prop);
        }
        style(prop = {}) {
            // set is css json object
            prop.set.keyMap((key, val) => {
                elem.style[key] = val;
            })
        }
        html(prop = {}) {
            // set is array html string
            prop.elem.innerHTML = prop.set.join();
        }
        delegate(prop) {
            let set = prop;
            switch(typeof set.elem) {
                case "style": 
                  this.style(set)
                case "div": 
                  this.html(set)
            }
        }
        location(prop) {
            // Hvor skal element prop.elem ligge / flytte hen hen js path i doom jq selector
        }
        render(elements =[ { ['//klassenavnet til elemet', 'jspath', 'set data']} ]) {
            elements.forEach((prop = {}) => {
                prop.elem = this.elements.find((elem) => elem.name == prop.name);
                try {
                    this.delegate(prop);
                    this.location(prop);
                } catch(err) { console.log(err) }
            })
            this.wrap.innerHTML =  this.elements.join()
            return this.wrap;
        }
    }

    const shadow = container.attachShadow({ mode: 'open' });
    shadow.innerHTML = \`
        <style>
            #leinad_app_container {
                background-color: #111;
                color: white;
                font-family: sans-serif;
                padding: 10px;
                box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
                border-top-right-radius: 8px;
            }
        </style>
        <div id="leinad_app_container" class="leinad_app_render">☠️ Doom Mode Aktivert</div>
    \`;
})();