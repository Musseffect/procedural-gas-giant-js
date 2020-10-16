import Geometry from "./geometry";
export default class Quad{
    geometry: Geometry;
    constructor(gl: WebGL2RenderingContext){
        let vertexArray = [-1., -1.,
            1.0, -1.0,
            1.0, 1.0,
        -1.0, -1.0,
            1.0, 1.0,
        -1.0, 1.0
        ];
        this.geometry = new Geometry(gl, vertexArray);
    }
    render(gl: WebGL2RenderingContext){
        this.geometry.bind(gl);
        gl.drawArrays(gl.TRIANGLES, 0, this.geometry.count);
        this.geometry.unbind(gl);
    }
}
