class FPSCounter {
    /** @type {number[]} */
    #deltaTimeBuffer;
    /** @type {number} */
    #then;

    get #now(){ return Date.now() / 1000 }

    constructor(interval=20){
        this.#deltaTimeBuffer = new Array(interval).fill(0);
        this.#then = this.#now;
    }

    update(){
        const now = this.#now;
        const deltaTime = now - this.#then;
        this.#then = now;
        this.#deltaTimeBuffer.shift()
        this.#deltaTimeBuffer.push(deltaTime)
    }

    get FPS(){
        return this.#deltaTimeBuffer.length / this.#deltaTimeBuffer.reduce((a, b) => a + b);
    }
}