#version 300 es
layout(location = 0) in vec2 position;

out vec2 texCoords;

void main() {
	gl_Position = vec4(position,0.0, 1.0);
	texCoords=position;
}
