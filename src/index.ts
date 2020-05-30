// @ts-ignore
import * as dat from 'dat.gui';
import {Shader,TransformFeedbackVaryings} from './shader';
// @ts-ignore
import advectVert from "./Shaders/advect.vert";
// @ts-ignore
import advectFrag from "./Shaders/advect.frag";
// @ts-ignore
import generateParticleColorsVert from "./Shaders/generateParticleColors.vert";
// @ts-ignore
import generateParticleColorsFrag from "./Shaders/generateParticleColors.frag";
// @ts-ignore
import generateCubemapColorsVert from "./Shaders/generateCubemapColors.vert";
// @ts-ignore
import generateCubemapColorsFrag from "./Shaders/generateCubemapColors.frag";
// @ts-ignore
import renderPlanetVert from "./Shaders/renderPlanet.vert";
// @ts-ignore
import renderPlanetFrag from "./Shaders/renderPlanet.frag";
// @ts-ignore
import debugPointsVert from "./Shaders/debugPoints.vert";
// @ts-ignore
import debugPointsFrag from "./Shaders/debugPoints.frag";
// @ts-ignore
import debugSurfaceVert from "./Shaders/debugSurface.vert";
// @ts-ignore
import debugSurfaceFrag from "./Shaders/debugSurface.frag";
// @ts-ignore
import renderTrailsVert from "./Shaders/renderTrails.vert";    
// @ts-ignore
import renderTrailsFrag from "./Shaders/renderTrails.frag";
import mat4 from './mat4';
import vec3 from './vec3';
import { Gradient,GradientStop } from './gradient';
import {resolution} from './constants';
import UI from './UI';
import Quad from './quad';
import Texture from './texture';

const gui = new dat.GUI();

const extensionsList = [
    "EXT_color_buffer_float",
    "OES_texture_float_linear"
];
const saveImage = (function()
{
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display="none";
    return function(blob:Blob,filename:string)
    {
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
    }
})();
function parseGradient()
{

}
function prepareGradient(gradient:Gradient)
{
    gl.bindTexture(gl.TEXTURE_2D, gradientTexture);
    let pixels = new Uint8Array(256*3);
    for(let i=0;i<256;i++)
    {
        const value:vec3 = gradient.compute(i/256);
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
window.onload = function() {
    init();
  };

let frameIndex = 0;
class Programs{
    planetRender:Shader;
    advection:Shader;
    genParticleColors:Shader;
    debugPoints:Shader;
    debugSurface:Shader;
    renderTrails:Shader;
    genCubemapColors:Shader;
};
let extensions:Record<string, any>={};
var programs:Programs={
    planetRender:null,
    advection:null,
    genParticleColors:null,
    debugPoints:null,
    debugSurface:null,
    renderTrails:null,
    genCubemapColors:null
};
class ParticlesBuffer
{
    vao:WebGLVertexArrayObject;
    vbo:WebGLVertexArrayObject;
}
let gl:WebGL2RenderingContext = null;
let canvas:HTMLCanvasElement = null;
let surfaceTexture:WebGLTexture;
let framebuffers:WebGLFramebuffer[];
let particlesBuffers:ParticlesBuffer[];
let quad:Quad;
let gradientTexture:WebGLTexture;
let gradient:Gradient;
let particlesCount = 100000;//100000*16B  * 2 = 3 MB;
let width = 1024;
let height = 1024;
let currentBuffer = 0;
var ui = new UI(onRender,onRestart,onSaveSurfaceTexture);
class Directions{
    d:vec3[];
    u:vec3[];
    r:vec3[];
}
let directions:Directions = {
    d:[ vec3.create(1.0,0.0,0.0), vec3.create(-1.0,0.0,0.0), vec3.create(0.0,1.0,0.0), vec3.create(0.0,-1.0,0.0), vec3.create(0.0,0.0,1.0), vec3.create(0.0,0.0,-1.0)],
    u:[ vec3.create(0.0,-1.0,0.0), vec3.create(0.0,-1.0,0.0), vec3.create(0.0,0.0,1.0), vec3.create(0.0,0.0,-1.0), vec3.create(0.0,-1.0,0.0), vec3.create(0.0,-1.0,0.0)],
    r:[ vec3.create(0.0,0.0,-1.0), vec3.create(0.0,0.0,1.0), vec3.create(1.0,0.0,0.0), vec3.create(1.0,0.0,0.0), vec3.create(1.0,0.0,0.0), vec3.create(-1.0,0.0,0.0)],
}
let transformFeedback:any = null;

function initPrograms()
{
    programs.planetRender = new Shader(gl,renderPlanetVert,renderPlanetFrag);
    programs.advection = new Shader(gl,advectVert,advectFrag,{},new TransformFeedbackVaryings(['outPCU'],gl.INTERLEAVED_ATTRIBS));
    programs.genParticleColors = new Shader(gl,generateParticleColorsVert,generateParticleColorsFrag,{},new TransformFeedbackVaryings(['outPCU'],gl.INTERLEAVED_ATTRIBS));
    programs.genCubemapColors = new Shader(gl,generateCubemapColorsVert,generateCubemapColorsFrag);
    programs.debugPoints = new Shader(gl,debugPointsVert,debugPointsFrag);
    programs.debugSurface = new Shader(gl,debugSurfaceVert,debugSurfaceFrag);
    programs.renderTrails = new Shader(gl,renderTrailsVert,renderTrailsFrag);
}
function initParticles()
{
    var particles=new Array(particlesCount*8);

	var count=0;
	var a=4.0*3.14159265/particlesCount;
	var d=Math.sqrt(a);
	var Mv=Math.round(3.14159265/d);
	var dv=3.14159265/Mv;
	var dphi=a/dv;
	//out.println(Mv+" Mv");
	for(var i=0;i<Mv;i++)
	{
		var v=3.14159265*(i+0.5)/Mv;
		const Mphi = Math.floor(2.0*3.14159265*Math.sin(v)/dphi);
		//out.println(Mphi+" Mphi");
		for(var j=0;j<Mphi;j++)
		{
			const phi=2.0*3.14159265*j/Mphi;
			var s=Math.sin(v);
            var index=count*8;
            particles[index]=Math.floor(s*Math.cos(phi)*32767);//x
            particles[index+1]=Math.floor(Math.cos(v)*32767);//y
            particles[index+2]=Math.floor(s*Math.sin(phi)*32767);//z
            
            particles[index+3]=0.0;//lifetime - distance
            particles[index+4]=0;//color r
            particles[index+5]=0;//color g
            particles[index+6]=0;//color b
            particles[index+7]=0;//color a
			count++;
		}
	}
	console.log(count+" particles were created");
	particles.splice(count*8,particlesCount*8-count*8);
	let particlesArray=new Int16Array(particles);
    particlesCount=count;
    particlesBuffers = [];
	particlesBuffers.push(new ParticlesBuffer());
    particlesBuffers.push(new ParticlesBuffer());
    particlesBuffers[0].vao = gl.createVertexArray();
    particlesBuffers[1].vao = gl.createVertexArray();
    particlesBuffers[0].vbo = gl.createBuffer();
    particlesBuffers[1].vbo = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER,particlesBuffers[0].vbo);
    gl.bufferData(gl.ARRAY_BUFFER, particlesArray, gl.STATIC_DRAW);
    gl.bindVertexArray(particlesBuffers[0].vao);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
	gl.vertexAttribPointer(0, 4, gl.SHORT, true, 16, 0);
	gl.vertexAttribPointer(1, 4, gl.SHORT, true, 16, 8);
    gl.bindBuffer(gl.ARRAY_BUFFER,particlesBuffers[1].vbo);
    gl.bufferData(gl.ARRAY_BUFFER, particlesArray, gl.STATIC_DRAW);
    gl.bindVertexArray(particlesBuffers[1].vao);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
	gl.vertexAttribPointer(0, 4, gl.SHORT, true, 16, 0);
	gl.vertexAttribPointer(1, 4, gl.SHORT, true, 16, 8);
	gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
}
function initTextures()
{
    surfaceTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,surfaceTexture);
	for(var i=0;i<6;i++){
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,gl.R8,resolution,resolution,0,gl.RED,gl.UNSIGNED_BYTE,null);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_R,gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,null);
    framebuffers = [];
	for(var i=0;i<6;i++){
        var id= gl.createFramebuffer();
        framebuffers.push(id);
	    gl.bindFramebuffer(gl.FRAMEBUFFER, id);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X+i, surfaceTexture, 0);
        let status:number; 
        if(!((status = gl.checkFramebufferStatus(gl.FRAMEBUFFER))==gl.FRAMEBUFFER_COMPLETE))
        {
            console.log("Framebuffer status: " + status);
            throw "Error";
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    gradientTexture = gl.createTexture();
    gradient = new Gradient().add(new GradientStop(0,vec3.create(0,0,0)))
    .add(new GradientStop(1,vec3.create(255,255,255)));
    prepareGradient(gradient);
}
function init()
{
    if(mobileCheck())
    {
        window.alert("I dont want to fry your phone");
        return;
    }

    canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    canvas.onmousedown = function(ev)
    {

    };
    canvas.onmousemove = function(ev)
    {

    }
    canvas.onmouseup = function(ev)
    {

    };
    // @ts-ignore
    gl=canvas.getContext("webgl2");
    if(!gl)
    {
        window.alert("THIS THING REQUIRES WEBGL 2");
        return;
        let div = document.createElement("div");
        div.style.zIndex = "1000";
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.position = "fixed";
        div.appendChild(document.createTextNode("THIS THING REQUIRES WEBGL 2"));
        document.body.appendChild(div);
        return;
    }
    for(let i=0;i<extensionsList.length;i++)
    {
        let extension = gl.getExtension(extensionsList[i]);
        if(extension==null)
        {
            window.alert(extensionsList[i] +" is unsupported");
        }
        extensions[extensionsList[i]] = extension;
    }

    initPrograms();
    console.info("Programs are initialized");
    initParticles();
    console.info("Particles are initialized");
    initTextures();
    console.info("textures are initialized");
    quad = new Quad(gl);
    transformFeedback = gl.createTransformFeedback();
    generateColors();

    gui.remember(ui);
    var f1 = gui.addFolder('Flow Field');
    //f1.add(ui,'dt',0,1);
    f1.add(ui,'lifeTime',0,1000,1);
    f1.add(ui,'advectionIterations',1,4);
    f1.add(ui,'bandFrequency',0,10);
    f1.add(ui,'mixBandSwirlVelocity',0,1);
    f1.add(ui,'swirlFrequency',0,10);
    f1.add(ui, 'integrator', ['euler','rk4','rk2']).setValue("euler");
    var f2 = gui.addFolder('Colors');
    f2.add(ui, 'gradient');
    var f3 = gui.addFolder('Blending');
    f3.add(ui, 'blendParticle',0,1);
    f3.add(ui, 'blendSurface',0,1);
    var f4 = gui.addFolder('Debug');
    f4.add(ui, 'showDebug');
    var f5 = gui.addFolder('Camera');
    f5.add(ui,'eyeX').step(0.05).listen();
    f5.add(ui,'eyeY').step(0.05).listen();
    f5.add(ui,'eyeZ').step(0.05).listen();
    f5.add(ui,'targetX').step(0.05);
    f5.add(ui,'targetY').step(0.05);
    f5.add(ui,'targetZ').step(0.05);
    f5.add(ui,'upX').step(0.05).max(1).min(-1);
    f5.add(ui,'upY').step(0.05).max(1).min(-1);
    f5.add(ui,'upZ').step(0.05).max(1).min(-1);
    f5.add(ui,'fov',0.1,179,0.1);
    f5.add(ui,"orbitCamera");
    gui.add(ui,'pause');
    gui.add(ui,'restart');
    gui.add(ui,'saveSurfaceTextures');
    gui.add(ui,'render');
    frameIndex = window.requestAnimationFrame(renderLoop);
}
//done
function generateColors()
{
	programs.genCubemapColors.bind(gl);
	gl.viewport(0,0,resolution,resolution);
	for(var i=0;i<6;i++)
	{
	    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
		programs.genCubemapColors.setUniform("direction",Float32Array.from(directions.d[i].toArray()));
		programs.genCubemapColors.setUniform("up",Float32Array.from(directions.u[i].toArray()));
		programs.genCubemapColors.setUniform("right",Float32Array.from(directions.r[i].toArray()));
		programs.genCubemapColors.bindUniforms(gl);
		quad.render(gl);
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    
	programs.genParticleColors.bind(gl);
    programs.genParticleColors.bindUniforms(gl);
	gl.enable(gl.RASTERIZER_DISCARD);
	// Bind the feedback object for the buffers to be drawn next
	// Draw points from input buffer with transform feedback
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, particlesBuffers[1-currentBuffer].vbo);

	gl.bindVertexArray(particlesBuffers[currentBuffer].vao);
	gl.beginTransformFeedback(gl.POINTS);
	gl.drawArrays(gl.POINTS, 0, particlesCount);
	gl.endTransformFeedback();
	gl.bindVertexArray(null);
	// Enable rendering
    gl.disable(gl.RASTERIZER_DISCARD);
    //swap buffers
	currentBuffer=1-currentBuffer;
}
function applyUI()
{
    //renderPlanet
    let dir = vec3.create(ui.targetX-ui.eyeX,ui.targetY-ui.eyeY,ui.targetZ-ui.eyeZ).normalize();
    let up = vec3.create(ui.upX,ui.upY,ui.upZ).normalize();
    let right = vec3.cross(dir,up).normalize();
    up = vec3.cross(right,dir).normalize();
    programs.planetRender.setUniforms({
        fov: ui.fov*Math.PI/180.0,
        eye: Float32Array.from([ui.eyeX,ui.eyeY,ui.eyeZ]),
        dir: Float32Array.from(dir.toArray()),
        right:Float32Array.from(right.toArray()),
        up: Float32Array.from(up.toArray()),
        aspect:width/height
    });
    //advect
    programs.advection.setUniforms({
        dt:ui.dt,
        lifeTime:ui.lifeTime,
        blendingFactor:ui.blendParticle,
        bandFrequency:ui.bandFrequency,
        swirlFrequency:ui.swirlFrequency,
    });
    //renderTrails
    programs.renderTrails.setUniform("alpha",ui.blendSurface);
    //
}
//done
function renderLoop()
{
    resize(canvas);
    width=canvas.clientWidth;
    height=canvas.clientHeight;
    applyUI();
    if(!ui.pause)
    {
        for(var i=0;i<ui.advectionIterations;i++)
        {
            moveParticles();
        }
        if(!ui.showDebug)
        {
            renderParticles();
        }
    }
    if(ui.showDebug)
    {
        renderDebug();
        //return;
    }else{
        renderPlanet();
    }
    frameIndex = window.requestAnimationFrame(renderLoop);
}

function moveParticles()
{

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP,surfaceTexture);
    
    programs.advection.setUniform("iTime",new Date().getMilliseconds());
	programs.advection.setUniform("fSampler0",0);	
	programs.advection.setUniform("seed",Float32Array.from([Math.random(),Math.random()]));
	programs.advection.bind(gl);
	programs.advection.bindUniforms(gl);
	
	gl.enable(gl.RASTERIZER_DISCARD);
	// Bind the feedback object for the buffers to be drawn next// Draw points from input buffer with transform feedback

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, particlesBuffers[1-currentBuffer].vbo);


	gl.bindVertexArray(particlesBuffers[currentBuffer].vao);
	gl.beginTransformFeedback(gl.POINTS);
	gl.drawArrays(gl.POINTS, 0, particlesCount);
	gl.endTransformFeedback();
	gl.bindVertexArray(null);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
	// Enable rendering
	gl.disable(gl.RASTERIZER_DISCARD);
	currentBuffer=1-currentBuffer;
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
}
function renderParticles()
{
    var view:mat4=mat4.createIdentity();
	var proj:mat4=mat4.createIdentity();
	proj.perspective(90.0,1.0,0.01,4.0);
	programs.renderTrails.bind(gl);
	gl.viewport(0,0,resolution,resolution);
	gl.enable(gl.BLEND);
	
	gl.bindVertexArray(particlesBuffers[currentBuffer].vao);
	let eye:vec3=vec3.create(0.0,0.0,0.0);
	for(var i=0;i<6;i++)
	{
	    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
	    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		view.lookAt(eye,
                directions.d[i],
                directions.u[i]);
		programs.renderTrails.setUniform("PV",Float32Array.from(mat4.mult(proj,view).toArray()));
        programs.renderTrails.bindUniforms(gl);
		gl.drawArrays(gl.POINTS,0,particlesCount);
	}
	gl.bindVertexArray(null);
	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
	gl.disable(gl.BLEND);
}

function renderPlanet()
{
	gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,surfaceTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,gradientTexture);
    programs.planetRender.bind(gl);
    programs.planetRender.setUniform("fSamplerCube",0);
    programs.planetRender.setUniform("gradient",1);
    programs.planetRender.bindUniforms(gl);
    quad.render(gl);
}

function renderDebug()
{
    var view:mat4=mat4.createIdentity();
	var proj:mat4=mat4.createIdentity();
    proj.perspective(ui.fov,width/height,0.1,100.0);
    let eye = vec3.create(ui.eyeX,ui.eyeY,ui.eyeZ);
    let dir = vec3.create(ui.targetX-ui.eyeX,ui.targetY-ui.eyeY,ui.targetZ-ui.eyeZ).normalize();
    let up = vec3.create(ui.upX,ui.upY,ui.upZ).normalize();
    let right = vec3.cross(dir,up).normalize();
    up = vec3.cross(right,dir).normalize();
    view.lookAt(eye,
        dir,
        up);
    gl.viewport(0, 0, width, height);
	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.disable(gl.BLEND);
	//gl.disable(gl.BLEND);
	gl.clearColor(1.0,0.0,0.0,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
    let PV = mat4.mult(proj,view);
    programs.debugSurface.bind(gl);
    programs.debugSurface.setUniforms({
        near:0.1,
        far:100.0,
        PV:Float32Array.from(PV.toArray()),
        V:Float32Array.from(view.toArray())
    });
    programs.debugSurface.bindUniforms(gl);
    quad.render(gl);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 5);
    programs.debugPoints.bind(gl);
    programs.debugPoints.setUniform("PV",Float32Array.from(PV.toArray()));
	programs.debugPoints.bindUniforms(gl);
	gl.bindVertexArray(particlesBuffers[currentBuffer].vao);
	gl.drawArrays(gl.POINTS,0,particlesCount);
	gl.bindVertexArray(null);

    //draw planet surface velocity field with depth

    //draw particles with depthTest

}

function resize(canvas:HTMLCanvasElement) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
   
    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {
   
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
  }

function mobileCheck() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor);
    return check;
  };
function onSaveSurfaceTexture() {
    var pixels = new Uint8Array(resolution * resolution);
    var directions = [
        "+X",
        "-X",
        "+Y",
        "-Y",
        "+Z",
        "-Z"
    ];
    var _canvas = document.createElement("canvas");
    _canvas.width = resolution;
    _canvas.height = resolution;
    var _context = _canvas.getContext("2d");
	for(var m=0;m<6;m++){
	    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[m]);
        gl.readPixels(0, 0, resolution, resolution, gl.RED, gl.UNSIGNED_BYTE, pixels);
        var imgData = _context.createImageData(resolution, resolution);
        const size = resolution*resolution;
        for(let i=0;i<size;i++)
        {
            let x = i%resolution;
            let y = Math.floor(i/resolution);
            const j = x+(resolution-y)*resolution;
            const color = gradient.compute(pixels[j]);
            imgData.data[i*4] = color.x()*255;
            imgData.data[i*4+1] = color.y()*255;
            imgData.data[i*4+2] = color.z()*255;
            imgData.data[i*4+3] = 255;
        }
        _context.putImageData(imgData, 0, 0);
        _canvas.toBlob(function (blob) {
            var today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            const yyyy = String(today.getFullYear()).padStart(4, '0');
            const hh = String(today.getHours()).padStart(2, '0');
            const minmin = String(today.getMinutes()).padStart(2, '0');
            var str = mm + '-' + dd + '-' + yyyy + '_' + hh + '-' + minmin;
            saveImage(blob, `planet_cubemap_${directions[m]}_${resolution}x${resolution}_${str}.png`);
        });
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};
function onRestart()
{
    generateColors();
}
function onRender()
{
    const w = 1920;
    const h = 1080;
    let saveBufferTexture: Texture = new Texture(gl, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null, [
        { key: gl.TEXTURE_MIN_FILTER, value: gl.LINEAR },
        { key: gl.TEXTURE_MAG_FILTER, value: gl.LINEAR },
        { key: gl.TEXTURE_WRAP_S, value: gl.CLAMP_TO_EDGE },
        { key: gl.TEXTURE_WRAP_T, value: gl.CLAMP_TO_EDGE }
    ]);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, saveBufferTexture.get(), 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, surfaceTexture);
    programs.planetRender.bind(gl);
    programs.planetRender.setUniform("fSamplerCube", 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,gradientTexture);
    programs.planetRender.setUniform("gradient",1);
    let dir = vec3.create(ui.targetX-ui.eyeX,ui.targetY-ui.eyeY,ui.targetZ-ui.eyeZ).normalize();
    let up = vec3.create(ui.upX,ui.upY,ui.upZ).normalize();
    let right = vec3.cross(dir,up).normalize();
    up = vec3.cross(right,dir).normalize();
    programs.planetRender.setUniforms({
        fov: ui.fov*Math.PI/180.0,
        eye: Float32Array.from([ui.eyeX,ui.eyeY,ui.eyeZ]),
        dir: Float32Array.from(dir.toArray()),
        right:Float32Array.from(right.toArray()),
        up: Float32Array.from(up.toArray()),
        aspect:width/height
    });
    programs.planetRender.bindUniforms(gl);
    quad.render(gl);
    var pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    Texture.unbind(gl, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    saveBufferTexture.destroy(gl);
    gl.deleteFramebuffer(fbo);
    var _canvas = document.createElement("canvas");
    _canvas.width = w;
    _canvas.height = h;
    var _context = _canvas.getContext("2d");
    var imgData = _context.createImageData(w, h);
    const size = w*h;
    for(let i=0;i<size;i++)
    {
        let x = i%w;
        let y = Math.floor(i/w);
        const j = x+(h-y)*w;
        imgData.data[i*4] = pixels[j*4];
        imgData.data[i*4+1] = pixels[j*4+1];
        imgData.data[i*4+2] = pixels[j*4+2];
        imgData.data[i*4+3] = 255;
    }
    _context.putImageData(imgData, 0, 0);
    /*var image=new Image();

    image.src=_canvas.toDataURL();*/
    _canvas.toBlob(function (blob) {
        var today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = String(today.getFullYear()).padStart(4, '0');
        const hh = String(today.getHours()).padStart(2, '0');
        const minmin = String(today.getMinutes()).padStart(2, '0');
        var str = mm + '-' + dd + '-' + yyyy + '_' + hh + '-' + minmin;
        saveImage(blob, `planet_render_${w}x${h}_${str}.png`);
    });
}