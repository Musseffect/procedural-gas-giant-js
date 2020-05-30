
interface TextureParameter
{
    key:number,
    value:number
}
class Texture
{
    tex:WebGLTexture;
    constructor(gl:WebGL2RenderingContext,level:number,internalFormat:number,
        width:number,height:number,border:number,
        srcFormat:number,srcType:number,pixels:ArrayBufferView | null,parameters?:TextureParameter[])   
    {
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D,this.tex);
        gl.texImage2D(gl.TEXTURE_2D,level,internalFormat,width,height, border,srcFormat,srcType,pixels);
        if(parameters!=undefined)
            parameters.forEach(function(item:TextureParameter)
            {
                gl.texParameteri(gl.TEXTURE_2D,item.key,item.value);
            });
    }
    bind(gl:WebGL2RenderingContext,unit:number):void
    {
        gl.activeTexture(gl.TEXTURE0+unit);
        gl.bindTexture(gl.TEXTURE_2D,this.tex);
    }
    static unbind(gl:WebGL2RenderingContext,unit:number):void
    {
        gl.activeTexture(gl.TEXTURE0+unit);
        gl.bindTexture(gl.TEXTURE_2D,null);
    }
    get():WebGLTexture
    {
        return this.tex;
    }
    destroy(gl:WebGL2RenderingContext):void
    {
        gl.deleteTexture(this.tex);
    }
}

export default Texture;