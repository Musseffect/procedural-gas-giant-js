#version 300 es

layout(location = 0) in vec4 pos;
layout(location = 1) in vec4 col;

uniform mat4 PV;

out vec4 outColor;

void main() {
	gl_Position = PV*vec4(pos.xyz,1.0);
	outColor=col;
	gl_PointSize=1.0;
}
