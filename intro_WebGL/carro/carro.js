const canvas_carro = document.getElementById("canvasCarro");
const gl_carro = canvas_carro.getContext("webgl2");

if (!gl_carro) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// FUNÇÕES AUXILIARES 
// --------------------------------------------------

function retangulo(x1, y1, x2, y2) {
    return [
        x1, y1, x2, y1, x2, y2,
        x1, y1, x2, y2, x1, y2
    ];
}

// Roda: círculo = leque de triângulos
function roda(cx, cy, raio, lados) {
    const tris = [];
    for (let i = 0; i < lados; i++) {
        const a0 = i * 2 * Math.PI / lados;
        const a1 = (i + 1) * 2 * Math.PI / lados;
        tris.push(cx, cy);
        tris.push(cx + raio * Math.cos(a0), cy + raio * Math.sin(a0));
        tris.push(cx + raio * Math.cos(a1), cy + raio * Math.sin(a1));
    }
    return tris;
}

function corParaCadaVertice(vertices, r, g, b) {
    const cores = [];
    const numVertices = vertices.length / 2;
    for (let i = 0; i < numVertices; i++) {
        cores.push(r, g, b);
    }
    return cores;
}


// --------------------------------------------------
// 1. VERTICES
// --------------------------------------------------

const v_chassi = retangulo(-0.5, -0.15, 0.5, 0.05);
const v_cabine = retangulo(-0.25, 0.05, 0.25, 0.25);
const v_janela = retangulo(-0.2, 0.1, 0.2, 0.2);

const v_rodaEsquerda = roda(-0.3, -0.15, 0.12, 12);
const v_rodaDireita = roda(0.3, -0.15, 0.12, 12);

const v_rodaCentroE = roda(-0.3, -0.15, 0.05, 12);
const v_rodaCentroD = roda(0.3, -0.15, 0.05, 12);

const vertices_carro = new Float32Array([
    ...v_chassi,
    ...v_cabine,
    ...v_janela,
    ...v_rodaEsquerda,
    ...v_rodaDireita,
    ...v_rodaCentroE,
    ...v_rodaCentroD
]);


// --------------------------------------------------
// * CORES
// --------------------------------------------------

const colors_carro = new Float32Array([
    ...corParaCadaVertice(v_chassi, 0.85, 0.1, 0.1), // vermelho
    ...corParaCadaVertice(v_cabine, 0.7, 0.05, 0.05), // vermelho escuro
    ...corParaCadaVertice(v_janela, 0.5, 0.8, 1.0), // azul claro
    ...corParaCadaVertice(v_rodaEsquerda, 0.25, 0.25, 0.25), // cinza
    ...corParaCadaVertice(v_rodaDireita, 0.25, 0.25, 0.25), // cinza
    ...corParaCadaVertice(v_rodaCentroE, 0.05, 0.05, 0.05), // preto
    ...corParaCadaVertice(v_rodaCentroD, 0.05, 0.05, 0.05) // preto
]);


// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer_carro = gl_carro.createBuffer();

gl_carro.bindBuffer(gl_carro.ARRAY_BUFFER, verticesBuffer_carro);

gl_carro.bufferData(
    gl_carro.ARRAY_BUFFER,
    vertices_carro,
    gl_carro.STATIC_DRAW
);

const colorsBuffer_carro = gl_carro.createBuffer();

gl_carro.bindBuffer(gl_carro.ARRAY_BUFFER, colorsBuffer_carro);

gl_carro.bufferData(
    gl_carro.ARRAY_BUFFER,
    colors_carro,
    gl_carro.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource_carro = `#version 300 es

in vec2 aPosition;
in vec3 aColor;

out vec3 vColor;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vColor = aColor;
}

`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource_carro = `#version 300 es

precision mediump float;

in vec3 vColor;

out vec4 outColor;

void main() {
    outColor = vec4(vColor, 1.0);
}

`;


// --------------------------------------------------
// 5. COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        const error = gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}


const vertexShader_carro = createShader(
    gl_carro,
    gl_carro.VERTEX_SHADER,
    vertexShaderSource_carro
);

const fragmentShader_carro = createShader(
    gl_carro,
    gl_carro.FRAGMENT_SHADER,
    fragmentShaderSource_carro
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const program_carro = gl_carro.createProgram();

gl_carro.attachShader(program_carro, vertexShader_carro);
gl_carro.attachShader(program_carro, fragmentShader_carro);

gl_carro.linkProgram(program_carro);

if (!gl_carro.getProgramParameter(program_carro, gl_carro.LINK_STATUS)) {

    throw new Error(
        gl_carro.getProgramInfoLog(program_carro)
    );
}


// --------------------------------------------------
// 7. LOCAL DOS ATRIBUTOS
// --------------------------------------------------

const positionLocation_carro =
    gl_carro.getAttribLocation(
        program_carro,
        "aPosition"
    );

const colorLocation_carro =
    gl_carro.getAttribLocation(
        program_carro,
        "aColor"
    );


// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------

gl_carro.bindBuffer(gl_carro.ARRAY_BUFFER, verticesBuffer_carro);

gl_carro.enableVertexAttribArray(positionLocation_carro);

gl_carro.vertexAttribPointer(
    positionLocation_carro,
    2,
    gl_carro.FLOAT,
    false,
    0,
    0
);

gl_carro.bindBuffer(gl_carro.ARRAY_BUFFER, colorsBuffer_carro);

gl_carro.enableVertexAttribArray(colorLocation_carro);

gl_carro.vertexAttribPointer(
    colorLocation_carro,
    3,
    gl_carro.FLOAT,
    false,
    0,
    0
);


// --------------------------------------------------
// 9. LIMPAR TELA
// --------------------------------------------------

gl_carro.clearColor(0.1, 0.1, 0.1, 1.0);

gl_carro.clear(gl_carro.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

gl_carro.useProgram(program_carro);


gl_carro.drawArrays(
    gl_carro.TRIANGLES,
    0,
    vertices_carro.length / 2
);