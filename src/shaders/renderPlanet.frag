#version 300 es
precision mediump float;

in vec2 texCoords;

uniform float fov;
uniform vec3 eye;
uniform vec3 dir;
uniform vec3 right;
uniform vec3 up;
uniform float aspect;

uniform samplerCube fSamplerCube;

uniform sampler2D gradient;

out vec4 color;

void traceSphere(in vec3 ro,in vec3 rd,in vec3 center,
		in float r,out float t1,
		out float t2,out vec3 normal)
{
		vec3 L=ro-center;
		float b=dot(rd,L);
	    float d=b*b+r*r-dot(L,L);
	    t1=-1.0,t2=-1.0;
	    vec3 forward=vec3(1.0,0.0,0.0);
	    vec3 up=vec3(0.0,1.0,0.0);
	    vec3 left=cross(up,forward);
	   	if(d>0.0)
	    {
	    	float p=sqrt(d);
	        t1 = -b-p;
	        t2 = -b+p;
	        normal=normalize(ro+t1*rd-center);
	    }
}

/*vec2 boxIntersection( vec3 ro, vec3 rd,
                      vec3 boxSize, out vec3 outNormal )
{
    vec3 m = 1.0/rd;
    vec3 n = m*ro;
    vec3 k = abs(m)*boxSize;
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;
    float tN = max( max( t1.x, t1.y ), t1.z );
    float tF = min( min( t2.x, t2.y ), t2.z );
    if( tN > tF || tF < 0.0) return vec2(-1.0); // no intersection
    outNormal = ro+rd*tN;
    return vec2( tN, tF );
}*/

float grayscale(vec3 rgb)
{
	return dot(rgb,vec3(0.2989, 0.5870, 0.1140));
}


vec3 rotateVec3(vec3 vec,float theta,vec3 axis)
{
	float ct=cos(theta);
    return vec*ct+cross(vec,axis)*sin(theta)+axis*dot(axis,vec)*(1.0-ct);
}

vec3 tracePlanet(vec3 ro,vec3 rd)
{
	vec3 color=vec3(0.);
	float t1=-1.0,t2;
	vec3 normal;
	traceSphere(ro,rd,vec3(0.0,0.0,0.0),1.0,t1,t2,normal);
	/*
    vec3 normalCube;
	vec2 t=boxIntersection(ro, rd,
						  vec3(0.708), normal2 );*/
	/*normal=cubeSphere?normal:normalCube;*/
	if(t1<0.0)
		return color.xyz;
	//return texture(fSamplerCube,normal).xyz;
	//return texture(gradient,normal.xy).xyz;
	color=texture(gradient,vec2(texture(fSamplerCube,normal).x,0.5)).xyz;
	color*=max(0.0,dot(normal,-rd));
	return color;
}
vec3 getRayDirection()
{
	return normalize(dir + tan(fov*0.5)*(texCoords.x*right*aspect+texCoords.y*up));
}

void main() {
    vec3 ro = eye;
    vec3 rd = getRayDirection();
    color.xyz=tracePlanet(ro,normalize(rd));
	color.w = 1.0;
}
