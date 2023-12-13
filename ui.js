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

    [i.min, i.max, i.step] = [`${min}`, `${max}`, `${step}`];

    i.value = `${value}`;

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