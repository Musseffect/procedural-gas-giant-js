function mix(a:number,b:number,t:number)
{
    return a*(t-1)+b*t;
}
class vec3
{
    static mix(a: vec3, b: vec3, t: number): vec3 {
        return new vec3([mix(a.x(),b.x(),t),mix(a.y(),b.y(),t),mix(a.z(),b.z(),t)]);
    }
    static dot(a:vec3,b:vec3):number
    {
        return a.x()*b.x()+a.y()*b.y()+a.z()*b.z();
    }
    static cross(a: vec3, b: vec3): vec3 {
        return new vec3(
            [
                a.y()*b.z()-a.z()*b.y(),
                a.z()*b.x()-a.x()*b.z(),
                a.x()*b.y()-a.y()*b.x()
            ]);
    }
    values:number[];
    constructor(values:number[])
    {
        this.values = values;
    }
    lengthSqr()
    {
        return this.x()*this.x()+this.y()*this.y()+this.z()*this.z();
    }
    length()
    {
        return Math.sqrt(this.lengthSqr());
    }
    normalize():vec3
    {
        let l = this.length();
        this.values[0] /=l;
        this.values[1] /=l;
        this.values[2] /=l;
        return this;
    }
    setX(value:number):vec3
    {
        this.values[0] = value;
        return this;
    }
    setY(value:number):vec3
    {
        this.values[1] = value;
        return this;
    }
    setZ(value:number):vec3
    {
        this.values[2] = value;
        return this;
    }
    x():number
    {
        return this.values[0];
    }
    y():number
    {
        return this.values[1];
    }
    z():number
    {
        return this.values[2];
    }
    toArray():number[]
    {
        return this.values;
    }
    static create(x:number,y:number,z:number)
    {
        return new vec3([x,y,z]);
    }
}
export default vec3;