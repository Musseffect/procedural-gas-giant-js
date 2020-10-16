#version 300 es

layout(location = 0) in vec4 position;
layout(location = 1) in float color;

uniform mat4 PV;

out vec4 outColor;

void main(){
	gl_Position = PV*vec4(position.xyz,1.0);
	outColor=vec4(color);
	gl_PointSize=1.0;
}
