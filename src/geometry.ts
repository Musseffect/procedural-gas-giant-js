export default class Geometry{
    vbo: WebGLBuffer;
    vao: WebGLVertexArrayObject;
    count: number;
    constructor(gl: WebGL2RenderingContext, array: number[]){
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        this.count = array.length;
    }
    bind(gl: WebGL2RenderingContext){
        gl.bindVertexArray(this.vao);
    }
    unbind(gl: WebGL2RenderingContext){
        gl.bindVertexArray(null);
    }
}
