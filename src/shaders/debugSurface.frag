#version 300 es
precision mediump float;
in vec3 ro;
in vec3 rd;

uniform float near;
uniform float far;

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
vec3 tracePlanet(vec3 ro,vec3 rd)
{
	vec3 color=vec3(0.0,0.0,1.0);
	float t1=-1.0,t2;
	vec3 normal;
	traceSphere(ro,rd,vec3(0.0,0.0,0.0),1.0,t1,t2,normal);
	gl_FragDepth = 1.0;
	if(t2<0.0)
		return color;
	if(t1<0.0)
		t1=t2;
	float z = -t1;
	float ndcDepth = ((far+near)+2.*far*near/z)/(far-near);
	gl_FragDepth = ndcDepth*0.5+0.5;
	//return vec3(gl_FragDepth*0.25);
	//return vec3(step(0.0,normalize(ro+rd*t1).z));
	//float ndcDepth = (t1-near)/(far-near)*2.-1.;
	return vec3(1.0,1.0,1.0)*max(0.0,dot(normal,-rd));
}

void main() {
    color.w = 1.0;
    color.xyz=tracePlanet(ro,normalize(rd));
	//color.xyz = vec3(step(1.,abs(ro)));
	//color.xyz = vec3(1.0,0.0,0.0);
}
