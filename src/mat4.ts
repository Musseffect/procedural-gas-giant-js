import vec3 from "./vec3";
//column major
class mat4{
    values:number[];
    constructor(values:number[]){
        this.values = values;
    }

    static mult(a:mat4,b:mat4,out?:mat4):mat4{
        let values = new Array(16);
        for(let column=0;column<4;column++){
            for(let row=0;row<4;row++){
                let value = 0;
                for(let k=0;k<4;k++){
                    value += a.values[row+k*4]*b.values[column*4+k];
                }
                values[row+column*4] = value;
            }
        }
        if(out){
            out.values = values;
            return out;
        }
        let result:mat4 = new mat4(values);
        return result;
    }
    static createIdentity():mat4{
        return new mat4(
            [
                1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                0,0,0,1
            ]);
    }
    static createFromArray(values:number[]):mat4{
        return new mat4(values);
    }
    /**
     * Returns perspective matrix in `this`
     * @param fov field of view in degrees
     * @param aspect width/height
     * @param near near plane
     * @param far far plane
     */
    perspective(fov:number,aspect:number,near:number,far:number):mat4{
        let s = 1./Math.tan(fov/2*Math.PI/180);
        this.values = [
            s/aspect,0,0,0,
            0,s,0,0,
            0,0,-(far+near)/(far-near),-1,
            0,0,-2*far*near/(far-near),0
        ];
        /*this.values = [
            s/aspect,0,0,0,
            0,s,0,0,
            0,0,-(far+near)/(far-near),-2*far*near/(far-near),
            0,0,-1,0
        ];*/
        return this;
    }
    set2(row:number,column:number,value:number){
        this.values[row*4 + column] = value;
    }
    at2(row:number,column:number){
        return this.values[row*4 + column];
    }
    set(index:number,value:number){
        this.values[index] = value;
    }
    at(index:number):number{
        return this.values[index];
    }
    lookAt(eye:vec3,dir:vec3,up:vec3):mat4{
        let right:vec3 = vec3.cross(dir,up).normalize();
        up = vec3.cross(right,dir).normalize();
        this.values = [
            right.x(),up.x(),-dir.x(),0,
            right.y(),up.y(),-dir.y(),0,
           right.z(),up.z(),-dir.z(),0,
           -vec3.dot(eye,right),-vec3.dot(eye,up),vec3.dot(eye,dir),1,
        ];
        /*this.values = [
            right.x(),up.x(),-dir.x(),eye.x(),
            right.y(),up.y(),-dir.y(),eye.y(),
            right.z(),up.z(),-dir.z(),eye.z(),
            0,0,0,1,
        ];*/
        return this;
    }
    toArray():number[]{
        return this.values;
    }
    ortho(left:number,right:number,bottom:number,top:number,near:number,far:number):mat4{
        this.values = [
            2/(right-left),0,0,-(right+left)/(right-left),
            0,2/(top-bottom),0,-(top+bottom)/(top-bottom),
            0,0,-2/(far-near),-(far+near)/(far-near),
            0,0,0,1
        ];
        return this;
    }
}

export default mat4;