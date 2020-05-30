export class TransformFeedbackVaryings
{
    varyings:string[];
    bufferMode:number;
    constructor(varyings:string[],bufferMode:number)
    {
        this.varyings = varyings;
        this.bufferMode = bufferMode;
    }
}
class Uniform
{
    location:WebGLUniformLocation;
    type:number;
    value:any; 
}
export class Shader
{
    program:WebGLProgram;
    uniforms:Record<string,Uniform>;
    attributes:any;
    constructor(gl:WebGL2RenderingContext,vert:string,frag:string,attributes?:Record<string,number>,transformFeedbackVaryings?:TransformFeedbackVaryings)
    {
        this.program=gl.createProgram();
        let vertShader=gl.createShader(gl.VERTEX_SHADER);
        let fragShader=gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vertShader,vert);
        gl.compileShader(vertShader);

        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            console.log(`Error compiling vertex shader:`);
            console.log(gl.getShaderInfoLog(vertShader));
          }
        gl.shaderSource(fragShader,frag);
          
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            console.log(`Error compiling fragment shader:`);
            console.log(gl.getShaderInfoLog(fragShader));
        }
        gl.attachShader(this.program,vertShader);
        gl.attachShader(this.program,fragShader);

        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);

        let self=this;
        if(attributes!==undefined)
        {
            Object.keys(attributes).forEach(function(key:string)
            {
                let item=attributes[key];
                gl.bindAttribLocation(this.program,item,key);
            },this);
        }
        if(transformFeedbackVaryings!==undefined)
        {
            gl.transformFeedbackVaryings(this.program,transformFeedbackVaryings.varyings,transformFeedbackVaryings.bufferMode);
        }
        gl.linkProgram(this.program);
        if ( !gl.getProgramParameter( this.program, gl.LINK_STATUS) ) {
            var info = gl.getProgramInfoLog(this.program);
            throw 'Could not compile WebGL program. \n\n' + info;
          }
          this.attributes={};
          const numAttribs = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
          for (let i = 0; i < numAttribs; i++) {
            const attribInfo = gl.getActiveAttrib(this.program, i);
            const location = gl.getAttribLocation(this.program, attribInfo.name);
            this.attributes[attribInfo.name]=location;
            //console.log(index, attribInfo.name);
          }
          this.uniforms={};
          const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
          for(let i=0;i<numUniforms;i++)
          {
            const uniformInfo = gl.getActiveUniform(this.program,i);
            const location = gl.getUniformLocation(this.program,uniformInfo.name);
            this.uniforms[uniformInfo.name]={location:location,type:uniformInfo.type,value:null};
          }
    }
    bind(gl:WebGL2RenderingContext):void
    {
        gl.useProgram(this.program);
    }
    setUniform(key:string,value:any):void
    {
        try{
        this.uniforms[key].value=value;
        }catch(err)
        {
            console.log(err +" in setUniform() for key \""+ key+"\"");
        }
    }
    setUniforms(uniformsMap:Record<string,any>):void
    {
        let self=this;
        Object.keys(uniformsMap).forEach(function(key)
        {
            try{
                self.uniforms[key].value=uniformsMap[key];
            }catch(err)
            {
                console.log(err +" in setUniforms() for key \""+ key+"\"");
            }
        });
    }
    getAttribute(key:string):number
    {
        return this.attributes[key];
    }
    bindUniform(gl:WebGL2RenderingContext,type:number,value:any,location:WebGLUniformLocation):void
    {
        switch(type)
        {
            case gl.FLOAT:
                gl.uniform1f(location,value);  
            break;
            case gl.FLOAT_VEC2:
                gl.uniform2fv(location,value);
                break;
            case gl.FLOAT_VEC3:
                    gl.uniform3fv(location,value);break;
            case gl.FLOAT_VEC4:
                    gl.uniform4fv(location,value);break;
            case gl.INT:
                gl.uniform1i(location,value);break;
            case gl.INT_VEC2:
                    gl.uniform2iv(location,value);break;
            case gl.INT_VEC3:
                    gl.uniform3iv(location,value);break;
            case gl.INT_VEC4:
                    gl.uniform4iv(location,value);break;
            case gl.FLOAT_MAT2:
                    gl.uniformMatrix2fv(location,false,value);
                break;
            case gl.FLOAT_MAT3:
                    gl.uniformMatrix3fv(location,false,value);break;
            case gl.FLOAT_MAT4:
                    gl.uniformMatrix4fv(location,false,value);break;
            case gl.SAMPLER_2D:
                    gl.uniform1i(location,value);break;
            //case gl.SAMPLER_CUBE:break;
        }
    }
    bindUniforms(gl:WebGL2RenderingContext):void
    {
        let self=this;
        Object.keys(this.uniforms).forEach(function(key)
        {
            let uniform=self.uniforms[key];
            if(uniform.value!=null)
            {
                self.bindUniform(gl,uniform.type,uniform.value,uniform.location);
            }
        });
    }
    destroy(gl:WebGL2RenderingContext):void
    {
        gl.deleteProgram(this.program);
    }
}