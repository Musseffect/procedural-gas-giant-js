#version 300 es

layout(location = 0) in vec2 position;

uniform vec3 direction;
uniform vec3 up;
uniform vec3 right;

out vec3 normal;

void main() {
	gl_Position = vec4(position.xy,0.0, 1.0);
	normal=(direction+up*position.y+right*position.x);
}
