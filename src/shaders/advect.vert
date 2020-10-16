#version 300 es
layout(location = 0) in vec4 inPosition;
layout(location = 1) in float inColor;
layout(location = 2) in float inLifetime;
layout(location = 3) in float inHeight;

uniform float dt;
uniform float bandsSwirlMix;
uniform float time;
uniform float blendingFactor;
uniform float swirlFrequency;
uniform float bandFrequency;
uniform float maxLifetime;
uniform vec2 seed;
uniform samplerCube fSampler0;

flat out ivec4 outPCU;
vec3 mod289(vec3 x){
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x){
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x){
	return mod289(((x * 34.0) + 1.0) * x);
}
vec4 taylorInvSqrt(vec4 r){
	return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v, out vec3 gradient){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  vec4 m2 = m * m;
  vec4 m4 = m2 * m2;
  vec4 pdotx = vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3));

  // Determine noise gradient
  vec4 temp = m2 * m * pdotx;
  gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
  gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
  gradient *= 42.0;

  return 42.0 * dot(m4, pdotx);
}
float rand1d(float n){
  return fract(cos(n*89.42)*343.42);
}
float gradientNoise1d(float v){
	float i = floor(v);
  float f = fract(v);
  float u = f*f*(3.0-2.0*f);
  return mix((rand1d(i)*2.-1.)*f,
    (rand1d(i + 1.0)*2.-1.)*(f-1.0), u);
}
float noise1d(float v){
	float i = floor(v);
  float f = fract(v);
  float u = f*f*(3.0-2.0*f);
  return mix( rand1d( i),
    rand1d( i + 1.0), u);
}
float nn(vec3 normal,float shift,float count){
	float h=asin(normal.z);
	return noise1d(sign(normal.z)*((h)*count));
}

vec3 bands(vec3 normal,float shift,float count,float maxSpeed,float minSpeed){
	float value=mix(minSpeed,maxSpeed,nn(normal,shift,count));
	return vec3(0.0,0.0,1.0)*value;
}
vec3 swirl(vec3 normal,float frequency){
	vec3 grad;
  snoise(normal*frequency,grad);
	return grad;
}
vec3 angularVelocity(vec3 normal){
	/*float h=sqrt(1.0-normal.z*normal.z);
	float z = normal.z;
	float v=snoise(normal*10.0+vec3(10.0,2.0,-120.0),swirlVelocity);*/
  vec3 swirlVelocity = swirl(normal,30.0)+
    swirl(normal,80.0)+swirl(normal,5.0);
	vec3 bandsVelocity = bands(normal.xyz,0.0,1.0*bandFrequency,35.0,-35.0)+
	  bands(normal.xyz,0.0,2.0*bandFrequency,25.0,-15.0);
	vec3 velocity = mix(bandsVelocity,swirlVelocity*(noise1d(time*0.1)),bandsSwirlMix);
	velocity=cross(velocity,normal);
	velocity=cross(normal,velocity);
	return velocity;
}
vec3 rotateVec3(vec3 vec,float theta,vec3 axis){
	float ct=cos(theta);
  return vec*ct+cross(vec,axis)*sin(theta)+axis*dot(axis,vec)*(1.0-ct);
}
vec3 integrate(vec3 p,float dt){
  vec3 grad=angularVelocity(p);
  vec3 n=rotateVec3(p,length(grad)*dt,normalize(grad));
  return normalize(n);
}
/*vec3 advectEuler(vec3 p){
	vec3 normal=p.xyz;
	vec3 _p=normal;
	_p = integrate(_p,dt);
	return _p;
}
vec3 advectRK4(vec3 p){
	vec3 k1 = angularVelocity(p);
	vec3 k2 = angularVelocity(rotateVec3(p,length(k1)*dt*0.5,normalize(k1)));
	vec3 k3 = angularVelocity(rotateVec3(p,length(k2)*dt*0.5,normalize(k2)));
	vec3 k4 = angularVelocity(rotateVec3(p,length(k3)*dt,normalize(k3)));
	vec3 g = k1/6.+k2/3.+ k3/3. + k4/6.;
	return normalize(rotateVec3(p,length(g)*dt,normalize(g)));
}*/
vec3 advectRK2(vec3 p){
	vec3 k1 = angularVelocity(p);
	vec3 k2 = angularVelocity(rotateVec3(p,length(k1)*dt*0.5,normalize(k1)));
	return normalize(rotateVec3(p,length(k2)*dt,normalize(k2)));
}
int packShort(float a){
	int v=int(clamp(floor(a*32767.0),-32767.0,32767.0));
	return (v&0x00007FFF)|((v>>16)&0x8000);
}
int packUshort(float a){
	int v=int(clamp(floor(a*65535.0),0.0,65535.0));
	return (v&0x00008FFF);
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

float rand3d(vec3 p){
	return abs(fract(sin(dot(p, vec3(12.9898,78.233,133.13719)))* 43758.5453123)*2.0-1.0);
}

void main(){
	vec3 newPosition=advectRK2(inPosition.xyz);
  float newColor = mix(inColor, texture(fSampler0,inPosition.xyz).x, blendingFactor);
  float newLifetime = inLifetime + length(newPosition - inPosition.xyz);
	
  if(newLifetime>=maxLifetime)
	{
		float u=rand3d(vec3(gl_VertexID,time,seed.x))*2.0-1.0;
		float theta=rand3d(vec3(gl_VertexID,time,seed.y))*2.0*3.1415926535898;
		newPosition.x=sqrt(1.0-u*u)*cos(theta);
		newPosition.y=sqrt(1.0-u*u)*sin(theta);
		newPosition.z=u;
		newColor=mix(texture(fSampler0,newPosition).x,nn(newPosition.xyz,0.0,10.0),0.5);
		newLifetime=0.0;
	}
	outPCU=packPCU(newPosition,newColor,newLifetime,inHeight);
}
