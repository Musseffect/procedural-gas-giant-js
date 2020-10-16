import mat4 from "./mat4";
import vec3 from "./vec3";

export class OrbitCamera{
    theta:number;//latitude
    phi:number;//longtitude
    r:number;
    centerX:number;
    centerY:number;
    centerZ:number;
    fov:number;
    aspect:number;
    near:number;
    far:number;
    constructor(theta:number,phi:number,r:number,centerX:number,centerY:number,centerZ:number,fov:number,aspect:number,near:number,far:number){
        this.theta = theta;
        this.phi = phi;
        this.r = r;
        this.centerX = centerX;
        this.centerY = centerY;
        this.centerZ = centerZ;
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
    }
    getMatrix():mat4{
        let th = this.theta*Math.PI/180.0;
        let ph = this.phi*Math.PI/180.0;
        let eye = vec3.create(Math.cos(ph)*Math.cos(th),Math.sin(ph)*Math.cos(th),Math.sin(th));
        let view = mat4.createIdentity().lookAt(
            eye,
            vec3.create(this.centerX-eye.x(),this.centerY-eye.y(),this.centerZ-eye.z()),
            vec3.create(0.,0.,1.));
        let proj = mat4.createIdentity().perspective(this.fov*Math.PI/180.,this.aspect,this.near,this.far);
        return mat4.mult(proj,view);
    }
}
export class FPSCamera{
    pitch:number;//rotate left - right around up vector
    yaw:number;//rotate up - down around cross(rotatetDir,up)
    x:number;
    y:number;
    z:number;
    fov:number;
    aspect:number;
    near:number;
    far:number;
    constructor(pitch:number,yaw:number,x:number,y:number,z:number,fov:number,aspect:number,near:number,far:number){

    }
    getMatrix():mat4{
        //default dir vector (-1,0,0)
        //up vector (0,0,1)
        let pt = this.pitch*Math.PI/180.0;
        let ya = this.yaw*Math.PI/180.0;
        let view = mat4.createIdentity().lookAt(
            vec3.create(this.x,this.y,this.z),
            vec3.create(this.x-Math.cos(pt)*Math.cos(ya),this.y+Math.sin(pt)*Math.cos(ya),this.z+Math.sin(ya)),
            vec3.create(0.,0.,1.));
        let proj = mat4.createIdentity().perspective(this.fov*Math.PI/180.,this.aspect,this.near,this.far);
        return mat4.mult(proj,view);
    }
}