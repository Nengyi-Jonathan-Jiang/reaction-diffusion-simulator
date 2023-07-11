// Add UI

const {
    steps_per_frame, steps_per_frame_display, fDisplay,
    tDisplay, fpsDisplay, useFancyDisplay, paused,
    diffuseRadius, resetButton
} = (function () {
    const masterContainer = addDiv(document.body, 'controls');

    const line1 = addDiv(masterContainer);
    addText(line1, 'Steps per frame: ');
    const steps_per_frame = addSlider(line1, 'steps-per-frame', 1, 8, 1, 4);
    const steps_per_frame_display = addDisplay(line1, 'steps-per-frame-display');

    const line2 = addDiv(masterContainer);
    const paused = addPlayPause(line2, 'play-pause');
    addText(line2, ' feedRate: ');
    const fDisplay = addDisplay(line2, 'feed-display');
    addText(line2, ', t = ');
    const tDisplay = addDisplay(line2, 'time-display');

    const line3 = addDiv(masterContainer);
    addText(line3, 'FPS: ');
    const fpsDisplay = addDisplay(line3, 'fps-display');

    const line4 = addDiv(masterContainer);
    addText(line4, 'Use Fancy Display: ')
    const useFancyDisplay = addSwitch(line4, 'use-fancy-text');

    const line5 = addDiv(masterContainer);
    addText(line5, 'Diffusion Radius: ')
    const diffuseRadius = addSlider(line5, 'diffuse-radius', 1, 8, 1, 4);

    const resetButton = addButton(masterContainer, 'reset-btn');
    addText(resetButton, "Reset Simulation");

    return {
        steps_per_frame, steps_per_frame_display, fDisplay,
        tDisplay, fpsDisplay, useFancyDisplay, paused,
        diffuseRadius, resetButton
    }
})();

// Setup rendering

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const aux = new GLCanvas(document.createElement('canvas'));
aux.size = [1200, 600];

// feedRate milestones:
// t =   0: 0.07  | Blob expansion
// t =  50: 0.045 | Blob is unstable, break into strands
// t =  80: 0.03  | Strands become unstable, break into cells
// t = 120: 0.02  | Limit of life. Cells will eventually all die off after this limit.
aux.shader = `
precision mediump float;

in vec2 uv;
out vec4 fragColor;

uniform ivec2 resolution;
uniform float feedRate;
uniform sampler2D buffer;

uniform int mode;
const int diffuseRadius = 3;
const float removeRate = 0.06;
const float diffuseRateA = 1.;
const float diffuseRateB = 0.5;

vec2 initialValues(ivec2 pixel){
    int x = pixel.x, y = pixel.y;
   
    return 
        abs(x / 4 - abs(y)) + abs(y) <= 5 
          ? vec2(1, 1)
          : vec2(1, 0); 
}

vec2 getUV(ivec2 pixel){
    vec2 fPixel = vec2(pixel) + 0.5;
    vec2 uv = fPixel / vec2(resolution.xy);
    vec2 res = mod(uv, 1.0);
    if(res.x <= 0.) res.x += 1.;
    if(res.y <= 0.) res.y += 1.;
    return res;
}

vec4 valueAt(ivec2 pixel){
    return texture(buffer, getUV(pixel));
}

vec4 update(ivec2 pixel){
    vec4 curr = valueAt(pixel);
    float a = curr.x;
    float b = curr.y;
   
    vec2 change;
    
    // The reaction: 2B + A -> 3B 
    change += a * b * b * vec2(-1, 1);
    
    // Feeding A
    change += feedRate * vec2(1.0 - a, -b);
    
    // Removing B
    change -= removeRate * vec2(0, b);
    
    return vec4(
        clamp(curr.xy + change, 0.0, 1.0),
        curr.zw + change
    );
}

void main(){
    ivec2 pixel = ivec2(uv * vec2(resolution));

    vec4 currVal = valueAt(pixel);
    
    if(mode == -3){
        fragColor = vec4(currVal.xy, 0, 0);
        return;
    }

    if(mode == -2){
        // initialize
        fragColor = vec4(initialValues(pixel - resolution.xy / 2), 0, 1);
        return;
    }
    
    if(mode == -1){
        // gaussian blur 
        float tWeight = 1.5;
        vec2 wSum = 
            0.25 * (
                valueAt(pixel + ivec2(1, 0)).xy
              + valueAt(pixel + ivec2(-1,0)).xy
              + valueAt(pixel + ivec2(0, 1)).xy
              + valueAt(pixel + ivec2(0,-1)).xy
            ) + 0.125 * (
                valueAt(pixel + ivec2( 1, 1)).xy
              + valueAt(pixel + ivec2(-1, 1)).xy
              + valueAt(pixel + ivec2( 1,-1)).xy
              + valueAt(pixel + ivec2(-1,-1)).xy
            );
        
        vec2 diffuse = (wSum / tWeight - currVal.xy) * vec2(diffuseRateA, diffuseRateB);
        
        fragColor = currVal + diffuse.xyxy;
        return;
    }

    if(mode == 0){
        fragColor = update(pixel);
        return;
    }
    
    float a = currVal.x;
    float b = currVal.y;
    float deltaA = currVal.z;
    float deltaB = currVal.w;
    float diff = a - b;
    
    if(mode == 2){
        fragColor = vec4(deltaB * 500., -diff, 0, 0)
            + 1. - pow(abs(diff - max(deltaB * 500., deltaA * 10.)), 0.6);
    }
    else {
        fragColor = vec4(
            0, 
            b,
            1. - a,
        1);
    }
}
`

let b1 = aux.createFrameBuffer(...aux.size);
let b2 = aux.createFrameBuffer(...aux.size);
aux.gl.uniform1i(aux.gl.getUniformLocation(aux.program, "buffer"), 0);
aux.setUniform('resolution', 'ivec2', ...aux.size);

let started = false;

resetButton.onclick = _ => started = false;

function graphicsStep(){
    aux.gl.bindFramebuffer(aux.gl.FRAMEBUFFER, null);
    aux.setUniform('mode', 'int', 1 + useFancyDisplay.checked);
    aux.render();

}

function clearChangeStep() {
    aux.setUniform('mode', 'int', -3);
    aux.gl.bindFramebuffer(aux.gl.FRAMEBUFFER, b2.frameBuffer);
    aux.gl.bindTexture(aux.gl.TEXTURE_2D, b1.texture);
    aux.render();

    [b1, b2] = [b2, b1];
}
function diffuseStep(){
    aux.setUniform('mode', 'int', -1);
    aux.gl.bindFramebuffer(aux.gl.FRAMEBUFFER, b2.frameBuffer);
    aux.gl.bindTexture(aux.gl.TEXTURE_2D, b1.texture);
    aux.render();

    [b1, b2] = [b2, b1];
}
function calculateStep(){

    aux.setUniform('mode', 'int', 0);
    aux.gl.bindFramebuffer(aux.gl.FRAMEBUFFER, b2.frameBuffer);
    aux.gl.bindTexture(aux.gl.TEXTURE_2D, b1.texture);
    aux.render();

    [b1, b2] = [b2, b1];
}
function initializeStep() {
    aux.setUniform('mode', 'int', -2);
    aux.gl.bindFramebuffer(aux.gl.FRAMEBUFFER, b2.frameBuffer);
    aux.gl.bindTexture(aux.gl.TEXTURE_2D, b1.texture);
    aux.render();

    [b1, b2] = [b2, b1];
}

let lastFrameTime = 0, t = 0;

function render(currFrameTime) {
    if(isNaN(currFrameTime)) currFrameTime = 0;
    currFrameTime /= 1000;
    const deltaTime = currFrameTime - lastFrameTime;
    lastFrameTime = currFrameTime;

    canvas.width = canvas.clientWidth,
    canvas.height = canvas.clientHeight
    ctx.fillStyle =  "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const feedRate = 0.02 ;// * (Math.pow(2, 1.5 - t / 10) + 1);

    aux.setUniform('feedRate', 'float', feedRate);

    if(!paused.checked)
        for(let i = 0; i < +steps_per_frame.value; i++) {
            clearChangeStep();

            for(let i = 0; i < +diffuseRadius.value; i++)
                diffuseStep();

            if (!started) initializeStep();
            else calculateStep();
            t += 0.016;
            started = true;
        }

    graphicsStep();

    ctx.drawImage(aux.canvas, 0, 0, aux.size[0], aux.size[1]);

    tDisplay.text = t.toFixed(1);
    fDisplay.text = feedRate.toFixed(3);
    fpsDisplay.text = (1 / deltaTime).toFixed(0);
    steps_per_frame_display.text = ` ${steps_per_frame.value}`;

    requestAnimationFrame(render)
}

render()