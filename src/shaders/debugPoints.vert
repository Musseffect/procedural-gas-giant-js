#version 300 es
precision mediump float;
layout(location = 0) in vec4 position;
//layout(location = 1) in float color;

uniform mat4 PV;
uniform vec3 ro;

out vec4 c;

void main(){
    //model matrix is identity
	gl_Position=PV*vec4(position.xyz,1.0);
	c=vec4(0.0,0.,0.,1.);
	gl_PointSize = 3./(length(position.xyz - ro)*2.+1.);
}
