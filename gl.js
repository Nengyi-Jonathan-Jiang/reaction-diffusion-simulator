class GLCanvas {
    /** @param {HTMLCanvasElement} [canvas] */
    constructor(canvas) {
        this.canvas = canvas ?? document.createElement('canvas');
        this.gl = canvas.getContext('webgl2');
        if(!this.gl){
            console.warn('failed to get webgl2 context, falling back to webgl1 (may cause errors)');
            // noinspection JSValidateTypes
            this.gl ??= canvas.getContext('webgl');
        }
        else {
            console.log('Using webgl2');
        }
        const gl = this.gl;
        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('OES_texture_float_linear');

        /**
         * @type {WebGLProgram}
         */
        this.program = null;

        /** @private */
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);

        this.shader = `
            precision mediump float;
            in vec2 uv;
            out vec4 fragColor;
            void main(){
                fragColor = vec4(0.5 + 0.5 * cos(uv.xyx + vec3(0,2,4)), 1.0);
            }
        `;
    }

    createFrameBuffer(targetTextureWidth, targetTextureHeight, type){
        const gl = this.gl;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        type ||= gl.UNSIGNED_BYTE;

        switch (type){
            case gl.FLOAT:
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, targetTextureWidth, targetTextureHeight, 0, gl.RGBA, type, null);
                break;
            default:
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, targetTextureWidth, targetTextureHeight, 0, gl.RGBA, gl.FLOAT, null);
                break;
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        // Create and bind the framebuffer
        const frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return {frameBuffer, texture};
    }

    /**
     * @param {string} name
     * @param {"float"|"int"|"vec2"|"ivec2"|"vec3"|"vec4"|"mat2"|"mat3"|"mat4"} type
     * @param {number} data
     */
    setUniform(name, type, ...data){
        const gl = this.gl;
        let loc = gl.getUniformLocation(this.program, name);

        switch(type){
            case "float": return gl.uniform1f(loc, data[0]);
            case "int": return gl.uniform1i(loc, data[0]);
            case "vec2":  return gl.uniform2f(loc, ...data);
            case "ivec2":  return gl.uniform2i(loc, ...data);
            case "vec3":  return gl.uniform3f(loc, ...data);
            case "vec4":  return gl.uniform4f(loc, ...data);
            case "mat2":  return gl.uniformMatrix2fv(loc, false, data);
            case "mat3":  return gl.uniformMatrix3fv(loc, false, data);
            case "mat4":  return gl.uniformMatrix4fv(loc, false, data);
            default: throw new TypeError(`WEBGL ERROR: Cannot set uniform of type ${type}`);
        }
    }

    render() {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    set size(size) {
        [this.canvas.width, this.canvas.height] = size;
        this.gl.viewport(-size[0], -size[1], size[0] * 2, size[1] * 2);
    }
    get size() { return [this.canvas.width, this.canvas.height] }

    set shader(fragSource){
        const vertSource = `
            in vec4 a_position;
            out vec2 uv;
            void main(){
                gl_Position = a_position;
                uv = vec2(a_position.x, a_position.y);
            }
        `
        /** @private */
        this.program = GLCanvas.createProgramFromSources(this.gl, vertSource, fragSource);
        const gl = this.gl;

        gl.enableVertexAttribArray(gl.getAttribLocation(this.program, 'a_position'));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(gl.getAttribLocation(this.program, "a_position"), 2, gl.FLOAT, false, 0, 0);

        gl.useProgram(this.program);
    }

    /**
     * @param {WebGLRenderingContext} gl - The WebGLRenderingContext to use.
     * @param {string} vertSource the - source for the vertex shader
     * @param {string} fragSource the - source for the fragment shader
     * @returns {WebGLProgram}
     */
    static createProgramFromSources(gl, vertSource, fragSource) {
        /**
         * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
         * @param {string} shaderSource The shader source.
         * @param {GLenum} shaderType The type of shader.
         * @returns {WebGLShader} The created shader.
         */
        function createShader(gl, shaderSource, shaderType) {
            const shader = gl.createShader(shaderType);
            gl.shaderSource(shader, '#version 300 es\n\n' + shaderSource);
            gl.compileShader(shader);
            if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                return shader;
            }
            console.log(
                "*** Error compiling shader '" + shader + "':" +
                gl.getShaderInfoLog(shader) + `\n` +
                shaderSource.split('\n').map((l, i) => (i + 1) + ':' + l).join('\n')
            );
            gl.deleteShader(shader);
            return null;
        }

        /**
         * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
         * @param {WebGLShader} shaders The shaders to attach
         * @returns {WebGLProgram} The created program.
         */
        function createProgram(gl, ...shaders) {
            const program = gl.createProgram();
            for (let shader of shaders) gl.attachShader(program, shader);
            gl.linkProgram(program);
            if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
                return program;
            }
            console.log('Error in program linking:' + gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return createProgram(gl,
            createShader(gl, vertSource, gl.VERTEX_SHADER),
            createShader(gl, fragSource, gl.FRAGMENT_SHADER)
        );
    }
}