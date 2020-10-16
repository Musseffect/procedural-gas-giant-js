#version 300 es


layout(location = 0) in vec4 position;

flat out ivec4 outPCU;

float rand1D(float n){
    return fract(cos(n*89.42)*343.42);
}
float gradientNoise1D(float v){
	float i = floor(v);
    float f = fract(v);
    float u = f*f*(3.0-2.0*f);
    return mix((rand1D( i)*2.-1.)*f,
                     (rand1D(i + 1.0)*2.-1.)*(f-1.0), u);
}
float noise1D(float v){
	float i = floor(v);
    float f = fract(v);
    float u = f*f*(3.0-2.0*f);
    return mix( rand1D( i),
                     rand1D( i + 1.0), u);
}
float nn(vec3 normal,float shift,float count){
	float h=asin(normal.z);
	return noise1D(sign(normal.z)*((h)*count+shift));
}

float getColor(vec3 normal){
	float color;
	color=nn(normal,7.0,20.0);
	return color;
}

int packColor(vec4 color){
	int t;//can use packUnorm4x8 and unpackUnorm4x8 if the version of Opengl is >=4.0
	t=(int(floor(color.x*255.0)))+(int(floor(color.y*255.0))<<8)+(int(floor(color.z*255.0))<<16+(int(floor(color.w*255.0))<<24));
	return (t);//this function available if version>=3.3
}
int packShort(float a){
	int v=int(clamp(floor(a*32767.0),-32767.0,32767.0));
	return (v&0x0000FFFF)|((v>>16)&0x8000);
}
ivec4 packPCU(vec3 pos,float c,float l,float h){
	ivec4 ic;
	//int col=packColor(c);
	ic.x=(packShort(pos.x)+(packShort(pos.y)<<16));
	ic.y=(packShort(pos.z)+(packShort(c)<<16));
	ic.z=(packShort(l)+(packShort(h)<<16));
  	ic.w = 0;
	return ic;
}
void main(){
	outPCU=packPCU(position.xyz,getColor(position.xyz),0.0,rand1D(position.x+rand1D(position.y+rand1D(position.z))));
}
