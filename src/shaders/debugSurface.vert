#version 300 es
layout(location = 0) in vec2 position;

uniform mat4 PV;
uniform mat4 V;

out vec3 ro;
out vec3 rd;

void main() {
    mat4 invPV = inverse(PV);
    ro = inverse(V)[3].xyz;
    vec4 rd4 = invPV* vec4(position,0.,1.);
    rd = normalize(rd4.xyz/rd4.w-ro);
    //ro = vec3(position,0.0);
	gl_Position = vec4(position,0.0, 1.0);
}
