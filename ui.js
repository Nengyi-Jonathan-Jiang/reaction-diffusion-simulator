/*
<div>
    <label for="speed-input">Steps per frame: </label>
    <input type="range" id="speed-input" step=".1" min="0" max="3" value="0"/>
    <span id="speed-display">1</span>
</div>
<div>
    <span class="play-pause">
        <input id="running" type="checkbox" checked="">
        <span></span>
        <label for="running" tabindex="1"></label>
    </span>
    <span id="time-display">t=</span>
</div>
<div>
    <label for="use-fancy-display">Use Fancy Display: </label>
    <label class="switch">
        <input type="checkbox" id="use-fancy-display">
        <span class="slider"></span>
    </label>
</div>
<div>
    <label for="vx-2">Step forward </label>
    <input type="number" id="vx-2" value="16"/><span>frames</span>
    <button>||&gt;</button>
</div>
<div>
    <label for="simulation-w">Simulation Size</label>
    <input type="number" id="simulation-w" value="1920"/><label for="simulation-h">px x</label>
    <input type="number" id="simulation-h" value="1080"/><span>px </span>
</div>
<button id="reset-btn">Reset Simulation</button>
 */

/**
 * @param {HTMLElement} el
 * @param {string} [id]
 */
function addDiv(el, id=''){
    let d = document.createElement('div');
    if(id !== '') d.id = id;
    el.appendChild(d);
    return d;
}

/**
 * @param {HTMLElement} el
 * @param {string} text
 */
function addText(el, text){
    let s = document.createElement('span');
    s.innerText = text;
    el.appendChild(s);
}

/**
 * @param {HTMLElement} el
 * @param {string} id
 */
function addDisplay(el, id){
    let s = document.createElement('span');
    s.id = id;
    el.appendChild(s);
    return { /** @param {number|string} str */ set text(str){ s.innerText = str } }
}

/**
 * @param {HTMLElement} el
 * @param {string} id
 */
function addButton(el, id){
    let d = document.createElement('button');
    d.id = id;
    el.appendChild(d);
    return d;
}

/**
 * @param {HTMLElement} el
 * @param {string} id
 * @param {number|string} [min]
 * @param {number|string} [max]
 * @param {number|string} [step]
 * @param {number|string} [value]
 */
function addSlider(el, id, min = 0, max = 10, step = .1, value = 0){
    let i = document.createElement('input');
    i.type = 'range';

    [i.min, i.max, i.value, i.step] = [`${min}`, `${max}`, `${value}`, `${step}`];

    i.id = id;
    el.appendChild(i);
    return i;
}

/**
 * @param {HTMLElement} el
 * @param {string} id
 * @param {string} [text]
 */
function addPlayPause(el, id, text=''){
    let s = document.createElement('span');
    s.className = 'play-pause';
    let i = document.createElement('input');
    i.type = 'checkbox';
    i.id = id;
    let s2 = document.createElement('span');
    s2.innerText = text;
    let l = document.createElement('label');
    l.htmlFor = id;
    l.tabIndex = 1;

    s.appendChild(i);
    s.appendChild(s2);
    s.appendChild(l);

    el.appendChild(s);

    return i;
}

/**
 * @param {HTMLElement} el
 * @param {string} id
 */
function addSwitch(el, id){
    let l = document.createElement('label');
    l.className = 'switch';
    let i = document.createElement('input');
    i.type = 'checkbox';
    i.id = id;
    let s = document.createElement('span');
    s.className = 'slider';

    l.appendChild(i);
    l.appendChild(s);

    el.appendChild(l);

    return i;
}

/**
 * @param {HTMLElement} el
 * @param {string} id
 * @param {number|string} [min]
 * @param {number|string} [max]
 * @param {number|string} [value]
 */
function addNumberInput(el, id, min=0, max=9999, value=0){
    let i = document.createElement('input');
    i.type = 'number';
    i.id = id;
    [i.min, i.max, i.value] = [`${min}`, `${max}`, `${value}`];
    el.appendChild(i);
    return i;
}