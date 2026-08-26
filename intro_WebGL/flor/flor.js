const canvas_flor = document.getElementById("canvasFlor");
const gl_flor = canvas_flor.getContext("webgl2");

if (!gl_flor) {
    throw new Error("WebGL 2 não é suportado.");
}


// --------------------------------------------------
// FUNÇÃO AUXILIAR: RETÂNGULO = 2 TRIÂNGULOS
// --------------------------------------------------

function retangulo(x1, y1, x2, y2) {
    return [
        x1, y1, x2, y1, x2, y2,
        x1, y1, x2, y2, x1, y2
    ];
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

// Caule (retângulo)
const v_caule = retangulo(-0.04, -0.8, 0.04, 0.05);

// Miolo (quadrado)
const v_miolo = retangulo(-0.08, 0.22, 0.08, 0.38);

// 4 pétalas 
const v_petalaCima = [
    -0.08, 0.38, 
    0.08, 0.38, 
    0.0, 0.6
];
const v_petalaBaixo = [
    -0.08, 0.22, 
    0.08, 0.22, 
    0.0, 0.05
];
const v_petalaEsquerda = [
    -0.08, 0.22, 
    -0.08, 0.38, 
    -0.3, 0.30
];
const v_petalaDireita = [
    0.08, 0.22, 
    0.08, 0.38, 
    0.3, 0.30
];

const vertices_flor = new Float32Array([
    ...v_caule,
    ...v_miolo,
    ...v_petalaCima,
    ...v_petalaBaixo,
    ...v_petalaEsquerda,
    ...v_petalaDireita
]);


// --------------------------------------------------
// * CORES
// --------------------------------------------------

const colors_flor = new Float32Array([
    ...corParaCadaVertice(v_caule, 0.0, 0.6, 0.0),  // verde
    ...corParaCadaVertice(v_miolo, 1.0, 0.85, 0.0), // amarelo
    ...corParaCadaVertice(v_petalaCima, 1.0, 0.3, 0.6), // rosa
    ...corParaCadaVertice(v_petalaBaixo, 1.0, 0.3, 0.6), // rosa
    ...corParaCadaVertice(v_petalaEsquerda, 1.0, 0.3, 0.6), // rosa
    ...corParaCadaVertice(v_petalaDireita, 1.0, 0.3, 0.6) // rosa
]);


// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer_flor = gl_flor.createBuffer();

gl_flor.bindBuffer(gl_flor.ARRAY_BUFFER, verticesBuffer_flor);

gl_flor.bufferData(
    gl_flor.ARRAY_BUFFER,
    vertices_flor,
    gl_flor.STATIC_DRAW
);

const colorsBuffer_flor = gl_flor.createBuffer();

gl_flor.bindBuffer(gl_flor.ARRAY_BUFFER, colorsBuffer_flor);

gl_flor.bufferData(
    gl_flor.ARRAY_BUFFER,
    colors_flor,
    gl_flor.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource_flor = `#version 300 es

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

const fragmentShaderSource_flor = `#version 300 es

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


const vertexShader_flor = createShader(
    gl_flor,
    gl_flor.VERTEX_SHADER,
    vertexShaderSource_flor
);

const fragmentShader_flor = createShader(
    gl_flor,
    gl_flor.FRAGMENT_SHADER,
    fragmentShaderSource_flor
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const program_flor = gl_flor.createProgram();

gl_flor.attachShader(program_flor, vertexShader_flor);
gl_flor.attachShader(program_flor, fragmentShader_flor);

gl_flor.linkProgram(program_flor);

if (!gl_flor.getProgramParameter(program_flor, gl_flor.LINK_STATUS)) {

    throw new Error(
        gl_flor.getProgramInfoLog(program_flor)
    );
}


// --------------------------------------------------
// 7. LOCAL DOS ATRIBUTOS
// --------------------------------------------------

const positionLocation_flor =
    gl_flor.getAttribLocation(
        program_flor,
        "aPosition"
    );

const colorLocation_flor =
    gl_flor.getAttribLocation(
        program_flor,
        "aColor"
    );


// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------

gl_flor.bindBuffer(gl_flor.ARRAY_BUFFER, verticesBuffer_flor);

gl_flor.enableVertexAttribArray(positionLocation_flor);

gl_flor.vertexAttribPointer(
    positionLocation_flor,
    2,
    gl_flor.FLOAT,
    false,
    0,
    0
);

gl_flor.bindBuffer(gl_flor.ARRAY_BUFFER, colorsBuffer_flor);

gl_flor.enableVertexAttribArray(colorLocation_flor);

gl_flor.vertexAttribPointer(
    colorLocation_flor,
    3,
    gl_flor.FLOAT,
    false,
    0,
    0
);


// --------------------------------------------------
// 9. LIMPAR TELA
// --------------------------------------------------

gl_flor.clearColor(0.1, 0.1, 0.1, 1.0);

gl_flor.clear(gl_flor.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------

gl_flor.useProgram(program_flor);

gl_flor.drawArrays(
    gl_flor.TRIANGLES,
    0,
    vertices_flor.length / 2
);