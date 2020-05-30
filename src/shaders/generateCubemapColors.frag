#version 300 es
precision mediump float;

in vec3 normal;
out vec4 Color;

float rand1D(float n){
    return fract(cos(n*89.42)*343.42);
}
float gradientNoise1D(float v)
{
	float i = floor(v);
    float f = fract(v);
    float u = f*f*(3.0-2.0*f);
    return mix((rand1D( i)*2.-1.)*f,
                     (rand1D(i + 1.0)*2.-1.)*(f-1.0), u);
}
float noise1D(float v)
{
	float i = floor(v);
    float f = fract(v);
    float u = f*f*(3.0-2.0*f);
    return mix( rand1D( i),
                     rand1D( i + 1.0), u);
}
float nn(vec3 normal,float shift,float count)
{
	float h=asin(normal.z);
	return noise1D(sign(normal.z)*((h)*count+shift));
}

vec3 getColor(vec3 normal)
{
	vec3 color;
	color=vec3(nn(normal,7.0,20.0));
	return color;
}

void main()
{
	Color.w = 1.0;
	Color.xyz=getColor(normalize(normal));
}

//! <preset file="genCubeMapColors.preset" />
