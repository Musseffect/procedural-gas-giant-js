// @ts-ignore
import * as dat from 'dat.gui';

const gui = new dat.GUI();

class UI
{
    gradient:string;
    saveSurfaceTextures:Function;
    stopContinue:Function;
    showDebug:boolean;
    blendParticle:number;
    blendSurface:number;
    integrator:string;
    constructor()
    {
        this.gradient = "0 0% 1 100%";
        this.saveSurfaceTextures = function(){};
        this.stopContinue = function(){};
        this.showDebug = false;
        this.blendParticle = 0.25;
        this.blendSurface = 0.25;
        this.integrator = 'euler';
    }
}

function parseGradient()
{

}

window.onload = function() {
    init();
  };

function init()
{
    var ui = new UI();
    var f1 = gui.addFolder('Flow Field');
    f1.add(ui, 'integrator', ['euler','rk4','rk2']).setValue("euler");
    var f2 = gui.addFolder('Colors');
    f2.add(ui, 'gradient');
    var f3 = gui.addFolder('Blending');
    f3.add(ui, 'blendParticle',0,1);
    f3.add(ui, 'blendSurface',0,1);
    var f4 = gui.addFolder('Debug');
    f4.add(ui, 'showDebug');

}



function moveParticles()
{


}
function renderParticles()
{

}

function renderPlanet()
{

}

function renderDebug()
{


}