import { Gradient } from "../gradient";
import vec3 from "../vec3";

export const saveImage = (function(){
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display="none";
    return function(blob:Blob,filename:string){
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
    }
})();
function parseGradient(){

}
export function prepareGradient(gl:WebGLRenderingContext,gradientTexture:WebGLTexture,gradient:Gradient){
    gl.bindTexture(gl.TEXTURE_2D, gradientTexture);
    let pixels = new Uint8Array(256*3);
    for(let i=0;i<256;i++){
        const value:vec3 = gradient.compute((i+0.5)/256);
        pixels[i*3] = value.x();
        pixels[i*3+1] = value.y();
        pixels[i*3+2] = value.z();
    }
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,256,1,0,gl.RGB,gl.UNSIGNED_BYTE,pixels);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
}