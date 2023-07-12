class Simulation {
    /** @type {GLCanvas} */
    #renderer;
    /** @type {WebGL2RenderingContext} */
    #gl;
    /** @type {{texture:WebGLTexture, frameBuffer: WebGLFramebuffer}[]} */
    #frameBuffers;
    /** @type {[number, number]}*/
    #size;

    get canvas(){
        return this.#renderer.canvas;
    }
    get width(){
        return this.#size[0];
    }
    get height(){
        return this.#size[1];
    }
    get size(){
        // Make sure not to return the actual array reference
        return [...this.#size];
    }

    #shouldResetSimulation = true;
    resetSimulation(){
        this.#shouldResetSimulation = true;
    }

    #simulationTime = 0;
    get simulationTime(){
        return this.#simulationTime;
    }

    //#region Simulation parameters

    #nStepsPerFrame = 4;
    set nStepsPerFrame(steps){
        if(isNaN(+steps) || steps <= 0 || steps > 8 || ~~steps !== +steps)
            throw new Error("Steps per frame must an integer in the range [1, 8]");
        this.#nStepsPerFrame = steps;
    }
    get nStepsPerFrame() { return this.#nStepsPerFrame }

    #useFancyRendering = false;
    set useFancyRendering(b){
        if(typeof(b) != "boolean") throw new Error("Must be a boolean");
        this.#useFancyRendering = b;
    }
    get useFancyRendering(){
        return this.#useFancyRendering;
    }

    #feedRate = 0.02;
    set feedRate(rate){
        if(isNaN(+rate) || +rate < 0)
            throw new Error("Feed rate must be a non-negative real number");
        this.#feedRate = +rate;
    }
    get feedRate() { return this.#feedRate }

    #removeRate = 0.06;
    set removeRate(rate){
        if(isNaN(+rate) || +rate < 0)
            throw new Error("Remove rate must be a non-negative real number");
        this.#removeRate = +rate;
    }
    get removeRate() { return this.#removeRate }

    #diffuseRadius = 4;
    set diffuseRadius(steps){
        if(isNaN(+steps) || steps <= 0 || steps > 8 || ~~steps !== +steps)
            throw new Error("Diffuse radius must an integer in the range [1, 8]");
        this.#diffuseRadius = steps;
    }
    get diffuseRadius() { return this.#diffuseRadius }

    //#endregion Simulation Parameters

    static get #SIMULATION_STEP_PHASES(){ return {
        RENDER_FANCY: 2, RENDER_NORMAL: 1,
        BEGIN_STEP: -3, DIFFUSION: -1, REACTION: 0,
        RESET_DATA: -2
    }}

    constructor(simulationWidth = 400, simulationHeight = 400) {
        const canvas = this.#renderer = new GLCanvas(document.createElement("canvas"));
        this.#size = canvas.size = [simulationWidth, simulationHeight];
        const gl = this.#gl = canvas.gl;
        
        canvas.shader = Simulation.shaderCode;

        this.#frameBuffers = [
            canvas.createFrameBuffer(simulationWidth, simulationHeight),
            canvas.createFrameBuffer(simulationWidth, simulationHeight)
        ];
        
        gl.uniform1i(this.#gl.getUniformLocation(canvas.program, "buffer"), 0);
        canvas.setUniform('resolution', 'ivec2', simulationWidth, simulationHeight);
    }

    #swapBuffers(){
        this.#frameBuffers = [this.#frameBuffers[1], this.#frameBuffers[0]];
        this.#gl.bindFramebuffer(this.#gl.FRAMEBUFFER, this.#frameBuffers[0].frameBuffer);
        this.#gl.bindTexture(this.#gl.TEXTURE_2D, this.#frameBuffers[1].texture);
    }

    #doPhase(phase){
        this.#renderer.setUniform('mode', 'int', phase);
        this.#swapBuffers();
        this.#renderer.render();
    }

    #doSimulationStep(){
        this.#doPhase(Simulation.#SIMULATION_STEP_PHASES.BEGIN_STEP);
        for(let i = 0; i < this.#diffuseRadius; i++)
            this.#doPhase(Simulation.#SIMULATION_STEP_PHASES.DIFFUSION);
        this.#doPhase(Simulation.#SIMULATION_STEP_PHASES.REACTION);

        this.#simulationTime += 0.016;
    }

    forceResetSimulation(){
        this.#doPhase(Simulation.#SIMULATION_STEP_PHASES.RESET_DATA);
        this.#simulationTime = 0;
        this.#shouldResetSimulation = false;
    }

    simulateNSteps(n=10) {
        this.#renderer.setUniform('feedRate', 'float', this.#feedRate);
        this.#renderer.setUniform('removeRate', 'float', this.#removeRate);
        for(let i = 0; i < n; i++)
            this.#doSimulationStep();
    }

    renderResults(){
        const renderMode = Simulation.#SIMULATION_STEP_PHASES[`RENDER_${this.#useFancyRendering ? 'FANCY' : 'NORMAL'}`];
        this.#renderer.setUniform('mode', 'int', renderMode);
        this.#gl.bindFramebuffer(this.#gl.FRAMEBUFFER, null);
        this.#renderer.render();
    }

    update() {
        if (this.#shouldResetSimulation)
            this.forceResetSimulation();
        this.simulateNSteps(this.#nStepsPerFrame);
        this.renderResults();
    }
}

Simulation.shaderCode = `
    precision highp float;
    precision highp sampler2D;
    
    in vec2 uv;
    out vec4 fragColor;
    
    uniform ivec2 resolution;
    uniform float feedRate;
    uniform float removeRate;
    uniform sampler2D buffer;
    
    uniform int mode;
    const int diffuseRadius = 3;
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
                a * pow(deltaB * 40., 2.), 
                b + pow(deltaB * 40., 2.),
                1. - a,
            1) + pow(deltaB * 40., 2.);
        }
    }
`