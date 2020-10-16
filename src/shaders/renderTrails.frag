#version 300 es
precision mediump float;
in vec4 outColor;

out vec4 color;

uniform float alpha;

/*float smootherstep(float a,float b,float x){
	x=clamp((x-a)/(b-a),0.0,1.0);
	return x*x*x * (x * (x * 6.0 - 15.0) + 10.0);
}

float gauss(float a,float c,float x){
	x=clamp(x,0.0,1.0);
	return (exp(-a*x)-exp(-c*a))/(1.0-exp(-c*a));
}*/

void main(){
	color=outColor;
	color.w=alpha;
}

