#version 300 es
layout(location = 0) in vec4 position;
layout(location = 1) in float color;

uniform vec2 seed;
uniform float iTime;

uniform samplerCube fSampler0;

flat out ivec2 outPCU;


float rand1D(float n){
  return fract(cos(n*89.42)*343.42);
}
float gradientNoise1D(float v){
	float i = floor(v);
  float f = fract(v);
  float u = f*f*(3.0-2.0*f);
  return mix((rand1D(i)*2.-1.)*f,
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
	return noise1D(sign(normal.z)*((h)*count));
}
int packShort(float a){
	int v=int(clamp(floor(a*32767.0),-32767.0,32767.0));
	return (v&0x00007FFF)|((v>>16)&0x8000);
}
ivec2 packPCU(vec3 pos,float c){
	ivec2 ic;
	ic.x=(packShort(pos.x)+(packShort(pos.y)<<16));
	ic.y=(packShort(pos.z)+(packShort(c)<<16));
	return ic;
}

float rand3D(vec3 p){
	return abs(fract(sin(dot(p, vec3(12.9898,78.233,133.13719)))* 43758.5453123)*2.0-1.0);
}

void main(){
	vec3 p=position.xyz;
  float u=rand3D(vec3(gl_VertexID,iTime,seed.x))*2.0-1.0;
  float theta=rand3D(vec3(gl_VertexID,iTime,seed.y))*2.0*3.1415926535898;
  p.x=sqrt(1.0-u*u)*cos(theta);
  p.y=sqrt(1.0-u*u)*sin(theta);
  p.z=u;
  float resColor=mix(texture(fSampler0,p.xyz).x,nn(p.xyz,7.0,20.0),0.05);
	outPCU=packPCU(p,resColor);
}
