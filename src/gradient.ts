import vec3 from "./vec3";

export class GradientStop
{
    offset:number;
    color:vec3;
    constructor(offset:number,color:vec3)
    {
        this.offset = offset;
        this.color = color;
    }
}
export class Gradient {
    stops: GradientStop[];
    constructor() {
        this.stops = [];
    }
    compute(offset:number):vec3
    {
        let i=0;
        if(offset<=this.stops[0].offset)
            return this.stops[0].color;
        while(i<this.stops.length)
        {
            if(this.stops[i].offset>offset)
            {
                const range = this.stops[i].offset-this.stops[i-1].offset;
                let t = (offset-this.stops[i-1].offset)/range;
                return vec3.mix(this.stops[i-1].color,this.stops[i].color,t);
            }
            i++;
        }
        return this.stops[this.stops.length-1].color;
    }
    add(stop: GradientStop):Gradient {
        let i = 0;
        while (i < this.stops.length) {
            if (this.stops[i].offset > stop.offset) {
                this.stops.splice(i, 0, stop);
                return this;
            }
            i++;
        }
        this.stops.push(stop);
        return this;
    }
}
