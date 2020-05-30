#version 300 es
precision mediump float;
layout(location = 0) out vec4 color;

in vec4 c;


void main()
{
	color=c;
}
