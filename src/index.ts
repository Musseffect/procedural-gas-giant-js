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
import resetParticleVert from "./Shaders/resetParticles.vert";
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
import {textureResolution} from './constants';
import UI from './UI';
import Quad from './quad';
import Texture from './texture';
import { prepareGradient, saveImage } from './utils/utils';

const gui = new dat.GUI();

const extensionsList = [
    "EXT_color_buffer_float",
    "OES_texture_float_linear"
];

window.onload = function(){
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
    resetParticles:Shader;
};
let extensions:Record<string, any>={};
var programs:Programs={
    planetRender:null,
    advection:null,
    genParticleColors:null,
    debugPoints:null,
    debugSurface:null,
    renderTrails:null,
    genCubemapColors:null,
    resetParticles:null
};
class ParticlesBuffer{
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
let transformFeedback:any = null;
let gradient:Gradient;
let particlesCount = 100000;//200000*8B  * 2 = 3 MB;
let width = 1024;
let height = 1024;
let time = 0;
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

function initPrograms(){
    programs.planetRender = new Shader(gl,renderPlanetVert,renderPlanetFrag);
    programs.advection = new Shader(gl,advectVert,advectFrag,{},new TransformFeedbackVaryings(['outPCU'],gl.INTERLEAVED_ATTRIBS));
    programs.genParticleColors = new Shader(gl,generateParticleColorsVert,advectFrag,{},new TransformFeedbackVaryings(['outPCU'],gl.INTERLEAVED_ATTRIBS));
    programs.genCubemapColors = new Shader(gl,generateCubemapColorsVert,generateCubemapColorsFrag);
    programs.debugPoints = new Shader(gl,debugPointsVert,debugPointsFrag);
    programs.debugSurface = new Shader(gl,debugSurfaceVert,debugSurfaceFrag);
    programs.renderTrails = new Shader(gl,renderTrailsVert,renderTrailsFrag);
    programs.resetParticles = new Shader(gl,resetParticleVert,advectFrag,{},new TransformFeedbackVaryings(['outPCU'],gl.INTERLEAVED_ATTRIBS));
}
function initParticles(){
    var particles=new Array(particlesCount*4);

	var count=0;
	var a=4.0*3.14159265/particlesCount;
	var d=Math.sqrt(a);
	var Mv=Math.round(3.14159265/d);
	var dv=3.14159265/Mv;
    var dphi=a/dv;
    const vertexComponents = 8;
	//out.println(Mv+" Mv");
	for(var i=0;i<Mv;i++){
		var v=3.14159265*(i+0.5)/Mv;
		const Mphi = Math.floor(2.0*3.14159265*Math.sin(v)/dphi);
		//out.println(Mphi+" Mphi");
		for(var j=0;j<Mphi;j++){
			const phi=2.0*3.14159265*j/Mphi;
			var s=Math.sin(v);
            var index=count*vertexComponents;
            particles[index]=Math.floor(s*Math.cos(phi)*32767);//x
            particles[index+1]=Math.floor(Math.cos(v)*32767);//y
            particles[index+2]=Math.floor(s*Math.sin(phi)*32767);//z
            particles[index+3]=0.0;//color
            particles[index+4]=0.0;//lifetime/covered distance
            particles[index+5]=0.0;//height
            particles[index+6]=0.0;//empty
            particles[index+7]=0.0;//empty
			count++;
		}
	}
	console.log(count+" particles were created");
	particles.splice(count*vertexComponents,(particlesCount-count)*vertexComponents);
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
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);
	gl.vertexAttribPointer(0, 3, gl.SHORT, true, 16, 0);
	gl.vertexAttribPointer(1, 1, gl.SHORT, true, 16, 6);
	gl.vertexAttribPointer(2, 1, gl.SHORT, true, 16, 8);
	gl.vertexAttribPointer(3, 1, gl.SHORT, true, 16, 10);
    gl.bindBuffer(gl.ARRAY_BUFFER,particlesBuffers[1].vbo);
    gl.bufferData(gl.ARRAY_BUFFER, particlesArray, gl.STATIC_DRAW);
    gl.bindVertexArray(particlesBuffers[1].vao);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);
	gl.vertexAttribPointer(0, 3, gl.SHORT, true, 16, 0);
	gl.vertexAttribPointer(1, 1, gl.SHORT, true, 16, 6);
	gl.vertexAttribPointer(2, 1, gl.SHORT, true, 16, 8);
	gl.vertexAttribPointer(3, 1, gl.SHORT, true, 16, 10);
	gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
}
function initTextures(){
    surfaceTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,surfaceTexture);
	for(var i=0;i<6;i++){
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,gl.R8,textureResolution,textureResolution,0,gl.RED,gl.UNSIGNED_BYTE,null);
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
        if(!((status = gl.checkFramebufferStatus(gl.FRAMEBUFFER))==gl.FRAMEBUFFER_COMPLETE)){
            console.log("Framebuffer status: " + status);
            throw "Error";
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    gradientTexture = gl.createTexture();
    gradient = new Gradient().add(new GradientStop(0,vec3.create(0,0,0)))
    .add(new GradientStop(1,vec3.create(255,255,255)));
    prepareGradient(gl,gradientTexture,gradient);
}
let cameraControls={
    isEnabled:false
};
function getViewEyeDirUp():vec3[]{
    let th = ui.latitude*Math.PI/180.0;
    let ph = ui.longitude*Math.PI/180.0;
    let eye = vec3.create(Math.cos(ph)*Math.cos(th)*(ui.radius+1),Math.sin(ph)*Math.cos(th)*(ui.radius+1),Math.sin(th)*(ui.radius+1));
    let right = vec3.create(-Math.sin(ph),Math.cos(ph),0);
    let dir = vec3.create(0-eye.x(),0-eye.y(),0-eye.z()).normalize();
    let up = vec3.cross(right,dir);
    return [eye,dir,up];
}
function init(){
    if(mobileCheck()){
        window.alert("I dont want to fry your phone");
        return;
    }

    canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;

    // @ts-ignore
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    
    // @ts-ignore
    document.exitPointerLock = document.exitPointerLock    || document.mozExitPointerLock || document.webkitExitPointerLock;
    canvas.onclick = function(ev){
        event.preventDefault();
        if(cameraControls.isEnabled){
            document.exitPointerLock();
        }else{
            cameraControls.isEnabled = false;
            canvas.requestPointerLock();
        }
    };
    document.onclick = function(ev){
        if(cameraControls.isEnabled){
            document.exitPointerLock();
        }
    }
    document.onwheel = function(ev){
        if(cameraControls.isEnabled){
            ui.radius*=Math.pow(2,ev.deltaY*0.01);
            //console.log(ev.deltaY);
            ui.radius = Math.max(0,ui.radius);
        }
    }
    document.onkeydown = function(ev){
        switch(ev.code){
            case "KeyW":
            case "ArrowUp":
                ui.latitude -= 0.1;
                ui.latitude = Math.min(Math.max(ui.latitude,-90),90);
                break;
            case "KeyS":
            case "ArrowDown":
                ui.latitude += 0.1;
                ui.latitude = Math.min(Math.max(ui.latitude,-90),90);
                break;
            case "KeyA":
            case "ArrowLeft":
                ui.longitude -= 0.1;
                ui.longitude = (mod(ui.longitude+180,360))-180;
                break;
            case "KeyD":
            case "ArrowRight":
                ui.longitude += 0.1;
                ui.longitude = (mod(ui.longitude+180,360))-180;
                 break;
            case "KeyR":
            case "ShiftRight":
            case "ShiftLeft":
                ui.radius*=Math.pow(2,0.1);
                ui.radius = Math.max(0,ui.radius);
                break; 
            case "KeyF":
            case "ControlRight":
            case "ControlLeft": 
                ui.radius*=Math.pow(2,-0.1);
                ui.radius = Math.max(0,ui.radius);
                break;
            case "NumpadAdd":
                ui.fov += 0.1;
                ui.fov = Math.min(ui.fov, 179);
                break;
            case "NumpadSubtract":
                ui.fov -= 0.1;
                ui.fov = Math.max(ui.fov, 0.1);
                break;
            default: return;
        }
    }
    document.addEventListener('pointerlockchange', function(){
        cameraControls.isEnabled = !cameraControls.isEnabled;
    }, false);
    function mod(a:number, n:number){
        return a - (n * Math.floor(a/n));
    }
    document.onmousemove = function(ev){
        if(cameraControls.isEnabled){
            event.preventDefault();
            let dx = ev.movementX;
            let dy = ev.movementY;
            ui.longitude += dx*0.1;
            ui.latitude -= dy*0.1;
            ui.longitude = (mod(ui.longitude+180,360))-180;
            ui.latitude = Math.min(Math.max(ui.latitude,-90),90);
        }
    };
    gl=canvas.getContext("webgl2");
    if(!gl){
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
    for(let i=0;i<extensionsList.length;i++){
        let extension = gl.getExtension(extensionsList[i]);
        if(extension==null){
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
    f1.add(ui,'lifeTime',0,6,0.01);
    f1.add(ui,'advectionIterations',1,4,1);
    //f1.add(ui,'swirlFrequency',0,10);
    f1.add(ui,'bandFrequency',0,10);
    f1.add(ui,'mixBandSwirlVelocity',0,1,0.05);
    f1.add(ui,'velocity',0,1,0.05);
    /*f1.add(ui, 'integrator', ['euler','rk4','rk2']).setValue("euler");*/
    //var f2 = gui.addFolder('Colors');
    //f2.add(ui, 'gradient');
    var f3 = gui.addFolder('Blending');
    f3.add(ui, 'blendParticle',0,1);
    f3.add(ui, 'blendSurface',0,1);
    var f4 = gui.addFolder('Debug');
    f4.add(ui, 'showDebug');
    var f5 = gui.addFolder('Camera');
    f5.add(ui,'longitude',-180,180,0.01).listen();
    f5.add(ui,'latitude',-90,90,0.01).listen();
    f5.add(ui,'radius').step(0.01).min(0.0).listen();
    f5.add(ui,'fov',0.1,179,0.1).listen();
    gui.add(ui,'pause');
    gui.add(ui,'restart');
    gui.add(ui,'save surface texture');
    gui.add(ui,'render');
    previousTimeStamp = performance.now();
    frameIndex = window.requestAnimationFrame(renderLoop);
}
//done
function generateColors(){
	programs.genCubemapColors.bind(gl);
	gl.viewport(0,0,textureResolution,textureResolution);
	for(var i=0;i<6;i++){
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
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, particlesBuffers[1-currentBuffer].vbo);

	gl.bindVertexArray(particlesBuffers[currentBuffer].vao);
	gl.beginTransformFeedback(gl.POINTS);
	// Draw points from input buffer with transform feedback
	gl.drawArrays(gl.POINTS, 0, particlesCount);
	gl.endTransformFeedback();
	gl.bindVertexArray(null);
	// Enable rendering
    gl.disable(gl.RASTERIZER_DISCARD);
    //Swap buffers
	currentBuffer=1-currentBuffer;
}
function applyUI(){
    let [eye,dir,up] = getViewEyeDirUp();
    let right = vec3.cross(dir,up).normalize();
    up = vec3.cross(right,dir).normalize();
    programs.planetRender.setUniforms({
        fov: ui.fov*Math.PI/180.0,
        eye: Float32Array.from(eye.toArray()),
        dir: Float32Array.from(dir.toArray()),
        right:Float32Array.from(right.toArray()),
        up: Float32Array.from(up.toArray()),
        aspect:width/height
    });
    programs.advection.setUniforms({
        dt:0.00033*ui.velocity,
        bandsSwirlMix:ui.mixBandSwirlVelocity,
        time:time,
        maxLifetime:ui.lifeTime,
        blendingFactor:ui.blendParticle,
        bandFrequency:ui.bandFrequency,
        //swirlFrequency:ui.swirlFrequency,
        seed:Float32Array.from([Math.random(),Math.random()])
    });
    programs.renderTrails.setUniform("alpha",ui.blendSurface);
}
function resetParticles(){
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP,surfaceTexture);
    
    programs.resetParticles.setUniform("iTime",new Date().getMilliseconds());
	programs.resetParticles.setUniform("fSampler0",0);	
	programs.resetParticles.setUniform("seed",Float32Array.from([Math.random(),Math.random()]));
	programs.resetParticles.bind(gl);
	programs.resetParticles.bindUniforms(gl);
	
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
let previousTimeStamp = 0;
//done
function renderLoop(timestamp:number){
    let dt = 1./60.;
    previousTimeStamp = timestamp;
    time+=dt;
    resize(canvas);
    width=canvas.clientWidth;
    height=canvas.clientHeight;
    applyUI();
    if(!ui.pause){
        for(var i=0;i<ui.advectionIterations;i++){
            moveParticles();
        }
        if(!ui.showDebug){
            renderParticles();
        }
        /*if(time>=ui.lifeTime){
            time = 0;
            resetParticles();
        }*/
    }
    if(ui.showDebug){
        renderDebug();
        //return;
    }else{
        renderPlanet();
    }
    frameIndex = window.requestAnimationFrame(renderLoop);
}

function moveParticles(){

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP,surfaceTexture);
    
    /*programs.advection.setUniform("iTime",new Date().getMilliseconds());*/
	programs.advection.setUniform("fSampler0",0);	
	/*programs.advection.setUniform("seed",Float32Array.from([Math.random(),Math.random()]));*/
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
function renderParticles(){
    var view:mat4=mat4.createIdentity();
	var proj:mat4=mat4.createIdentity();
	proj.perspective(90.0,1.0,0.01,4.0);
	programs.renderTrails.bind(gl);
	gl.viewport(0,0,textureResolution,textureResolution);
	gl.enable(gl.BLEND);
	
	gl.bindVertexArray(particlesBuffers[currentBuffer].vao);
	let eye:vec3=vec3.create(0.0,0.0,0.0);
	for(var i=0;i<6;i++){
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

function renderPlanet(){
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

function renderDebug(){
    var view:mat4=mat4.createIdentity();
	var proj:mat4=mat4.createIdentity();
    proj.perspective(ui.fov,width/height,0.1,100.0);
    let [eye,dir,up] = getViewEyeDirUp();
    /*let eye = vec3.create(ui.eyeX,ui.eyeY,ui.eyeZ);
    let dir = vec3.create(ui.targetX-ui.eyeX,ui.targetY-ui.eyeY,ui.targetZ-ui.eyeZ).normalize();
    let up = vec3.create(ui.upX,ui.upY,ui.upZ).normalize();*/
    let right = vec3.cross(dir,up).normalize();
    up = vec3.cross(right,dir).normalize();
    view.lookAt(eye,
        dir,
        up);
    gl.viewport(0, 0, width, height);
	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
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
        ro:Float32Array.from(eye.toArray())
    });
    programs.debugSurface.bindUniforms(gl);
    quad.render(gl);
    //gl.enable(gl.POLYGON_OFFSET_FILL);
    //gl.polygonOffset(1, 1);
    programs.debugPoints.bind(gl);
    programs.debugPoints.setUniforms({
        PV:Float32Array.from(PV.toArray()),
        ro:Float32Array.from(eye.toArray())
    });
	programs.debugPoints.bindUniforms(gl);
	gl.bindVertexArray(particlesBuffers[currentBuffer].vao);
	gl.drawArrays(gl.POINTS,0,particlesCount);
	gl.bindVertexArray(null);

    //draw planet surface velocity field with depth

    //draw particles with depthTest

}

function resize(canvas:HTMLCanvasElement){
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
   
    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight){
   
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
  }

function mobileCheck(){
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor);
    return check;
  };
function onSaveSurfaceTexture(){
    var pixels = new Uint8Array(textureResolution * textureResolution);
    var directions = [
        "+X[-Z-Y]",
        "-X[+Z-Y]",
        "+Y[+X+Z]",
        "-Y[+X-Z]",
        "+Z[+X-Y]",
        "-Z[-X-Y]"
    ];
    var _canvas = document.createElement("canvas");
    _canvas.width = textureResolution;
    _canvas.height = textureResolution;
    var _context = _canvas.getContext("2d");
    let k=0;
	for(var m=0;m<6;m++){
	    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[m]);
        gl.readPixels(0, 0, textureResolution, textureResolution, gl.RED, gl.UNSIGNED_BYTE, pixels);
        var imgData = _context.createImageData(textureResolution, textureResolution);
        const size = textureResolution*textureResolution;
        for(let i=0;i<size;i++){
            let x = i%textureResolution;
            let y = Math.floor(i/textureResolution);
            const j = x+(textureResolution-y-1)*textureResolution;
            //const color = gradient.compute((pixels[j]+0.5)/65536);
            const color = pixels[j];
            imgData.data[i*4] = color;
            imgData.data[i*4+1] = color;
            imgData.data[i*4+2] = color;
            imgData.data[i*4+3] = 255;
        }
        _context.putImageData(imgData, 0, 0);
        _canvas.toBlob(function (blob){
            var today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            const yyyy = String(today.getFullYear()).padStart(4, '0');
            const hh = String(today.getHours()).padStart(2, '0');
            const minmin = String(today.getMinutes()).padStart(2, '0');
            var str = mm + '-' + dd + '-' + yyyy + '_' + hh + '-' + minmin;
            saveImage(blob, `planet_cubemap_${directions[k++]}_${textureResolution}x${textureResolution}_${str}.png`);
        });
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};
function onRestart(){
    generateColors();
}
function onRender(){
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
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, surfaceTexture);
    programs.planetRender.bind(gl);
    programs.planetRender.setUniform("fSamplerCube", 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,gradientTexture);
    programs.planetRender.setUniform("gradient",1);
    let [eye,dir,up] = getViewEyeDirUp();
    let right = vec3.cross(dir,up).normalize();
    up = vec3.cross(right,dir).normalize();
    programs.planetRender.setUniforms({
        fov: ui.fov*Math.PI/180.0,
        eye: Float32Array.from(eye.toArray()),
        dir: Float32Array.from(dir.toArray()),
        right:Float32Array.from(right.toArray()),
        up: Float32Array.from(up.toArray()),
        aspect:w/h
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
    for(let i=0;i<size;i++){
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
    _canvas.toBlob(function (blob){
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