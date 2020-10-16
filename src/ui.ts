export default class UI{
    gradient: string;
    bandFrequency: number;
    swirlFrequency: number;
    mixBandSwirlVelocity:number;
    velocity:number;
    ["save surface texture"]: Function;
    showDebug: boolean;
    blendParticle: number;
    blendSurface: number;
    integrator: string;
    advectionIterations: number;
    restart: Function;
    render: Function;
    longitude :number;
    latitude:number;
    radius:number;
    fov: number;
    orbitCamera: boolean;
    lifeTime: number;
    pause: boolean;
    constructor(onRender:Function,onRestart:Function,onSaveSurfaceTexture:Function){
        this.gradient = "0 0% 1 100%";
        this["save surface texture"] = onSaveSurfaceTexture;
        this.bandFrequency = 7;
        this.swirlFrequency = 4;
        this.showDebug = false;
        this.blendParticle = 0.2;
        this.mixBandSwirlVelocity = 0.5;
        this.velocity = 1.;
        this.blendSurface = 0.31;
        this.integrator = 'euler';
        this.advectionIterations = 1;
        this.lifeTime = 4;
        this.longitude = 0;
        this.latitude = 45;
        this.radius = 2.0;
        this.fov = 35;
        this.pause = true;
        this.orbitCamera = false;
        this.restart = onRestart;
        this.render = onRender;
    }
}
