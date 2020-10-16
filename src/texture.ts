
interface TextureParameter{
    key:number,
    value:number
}
class Texture{
    handle:WebGLTexture;
    constructor(gl:WebGL2RenderingContext,level:number,internalFormat:number,
        width:number,height:number,border:number,
        srcFormat:number,srcType:number,pixels:ArrayBufferView | null,parameters?:TextureParameter[]){
        this.handle = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D,this.handle);
        gl.texImage2D(gl.TEXTURE_2D,level,internalFormat,width,height, border,srcFormat,srcType,pixels);
        if(parameters!=undefined)
            parameters.forEach(function(item:TextureParameter){
                gl.texParameteri(gl.TEXTURE_2D,item.key,item.value);
            });
    }
    bind(gl:WebGL2RenderingContext,unit:number):void{
        gl.activeTexture(gl.TEXTURE0+unit);
        gl.bindTexture(gl.TEXTURE_2D,this.handle);
    }
    static unbind(gl:WebGL2RenderingContext,unit:number):void{
        gl.activeTexture(gl.TEXTURE0+unit);
        gl.bindTexture(gl.TEXTURE_2D,null);
    }
    get():WebGLTexture{
        return this.handle;
    }
    destroy(gl:WebGL2RenderingContext):void{
        gl.deleteTexture(this.handle);
    }
}

export default Texture;