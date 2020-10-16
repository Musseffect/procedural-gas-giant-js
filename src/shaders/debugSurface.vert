#version 300 es
layout(location = 0) in vec2 position;

uniform mat4 PV;
uniform mediump vec3 ro;

out vec3 rd;

void main(){
    mat4 invPV = inverse(PV);
    vec4 t_rd = invPV* vec4(position,0.,1.);
    rd = normalize(t_rd.xyz/t_rd.w-ro);
	gl_Position = vec4(position,0.0, 1.0);
}
