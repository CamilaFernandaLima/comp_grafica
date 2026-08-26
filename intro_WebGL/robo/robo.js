const canvas_robo = document.getElementById("canvasRobo");
const gl_robo = canvas_robo.getContext("webgl2");

if (!gl_robo) {
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
 
const v_corpo = retangulo(-0.28, -0.45, 0.28, 0.1);
const v_cabeca = retangulo(-0.18, 0.1, 0.18, 0.4);
 
const v_olhoEsquerdo = retangulo(-0.08, 0.2, -0.02, 0.28);
const v_olhoDireito = retangulo(0.02, 0.2, 0.08, 0.28);
 
const v_antena = retangulo(-0.02, 0.4, 0.02, 0.55);
const v_bolinha = retangulo(-0.04, 0.55, 0.04, 0.63);
 
const v_pernaEsquerda = retangulo(-0.15, -0.7, -0.05, -0.45);
const v_pernaDireita = retangulo(0.05, -0.7, 0.15, -0.45);

const v_bracoEsquerdo = retangulo(-0.40, -0.1, -0.28, 0.03);
const v_bracoDireito = retangulo(0.28, -0.1, 0.40, 0.03);
 
const vertices_robo = new Float32Array([
    ...v_corpo,
    ...v_cabeca,
    ...v_olhoEsquerdo,
    ...v_olhoDireito,
    ...v_antena,
    ...v_bolinha,
    ...v_pernaEsquerda,
    ...v_pernaDireita,
    ...v_bracoEsquerdo,
    ...v_bracoDireito
]);
 
 
// --------------------------------------------------
// * CORES
// --------------------------------------------------
 
const colors_robo = new Float32Array([
    ...corParaCadaVertice(v_corpo, 0.25, 0.45, 0.65), // azul acinzentado
    ...corParaCadaVertice(v_cabeca, 0.30, 0.50, 0.70), // azul acinzentado
    ...corParaCadaVertice(v_olhoEsquerdo, 0.3, 0.0, 0.5), // roxo
    ...corParaCadaVertice(v_olhoDireito, 0.3, 0.0, 0.5), // roxo
    ...corParaCadaVertice(v_antena, 0.4, 0.4, 0.4), // cinza
    ...corParaCadaVertice(v_bolinha, 0.8, 0.1, 0.1), // vermelho
    ...corParaCadaVertice(v_pernaEsquerda, 0.2, 0.3, 0.5), // azul
    ...corParaCadaVertice(v_pernaDireita, 0.2, 0.3, 0.5), // azul
    ...corParaCadaVertice(v_bracoEsquerdo, 0.2, 0.3, 0.5), // azul
    ...corParaCadaVertice(v_bracoDireito, 0.2, 0.3, 0.5) // azul
]);
 
 
// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------
 
const verticesBuffer_robo = gl_robo.createBuffer();
 
gl_robo.bindBuffer(gl_robo.ARRAY_BUFFER, verticesBuffer_robo);
 
gl_robo.bufferData(
    gl_robo.ARRAY_BUFFER,
    vertices_robo,
    gl_robo.STATIC_DRAW
);
 
const colorsBuffer_robo = gl_robo.createBuffer();
 
gl_robo.bindBuffer(gl_robo.ARRAY_BUFFER, colorsBuffer_robo);
 
gl_robo.bufferData(
    gl_robo.ARRAY_BUFFER,
    colors_robo,
    gl_robo.STATIC_DRAW
);
 
 
// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------
 
const vertexShaderSource_robo = `#version 300 es
 
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
 
const fragmentShaderSource_robo = `#version 300 es
 
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
 
 
const vertexShader_robo = createShader(
    gl_robo,
    gl_robo.VERTEX_SHADER,
    vertexShaderSource_robo
);
 
const fragmentShader_robo = createShader(
    gl_robo,
    gl_robo.FRAGMENT_SHADER,
    fragmentShaderSource_robo
);
 
 
// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------
 
const program_robo = gl_robo.createProgram();
 
gl_robo.attachShader(program_robo, vertexShader_robo);
gl_robo.attachShader(program_robo, fragmentShader_robo);
 
gl_robo.linkProgram(program_robo);
 
if (!gl_robo.getProgramParameter(program_robo, gl_robo.LINK_STATUS)) {
 
    throw new Error(
        gl_robo.getProgramInfoLog(program_robo)
    );
}
 
 
// --------------------------------------------------
// 7. LOCAL DOS ATRIBUTOS
// --------------------------------------------------
 
const positionLocation_robo =
    gl_robo.getAttribLocation(
        program_robo,
        "aPosition"
    );
 
const colorLocation_robo =
    gl_robo.getAttribLocation(
        program_robo,
        "aColor"
    );
 
 
// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------
 
gl_robo.bindBuffer(gl_robo.ARRAY_BUFFER, verticesBuffer_robo);
 
gl_robo.enableVertexAttribArray(positionLocation_robo);
 
gl_robo.vertexAttribPointer(
    positionLocation_robo,
    2,
    gl_robo.FLOAT,
    false,
    0,
    0
);
 
gl_robo.bindBuffer(gl_robo.ARRAY_BUFFER, colorsBuffer_robo);
 
gl_robo.enableVertexAttribArray(colorLocation_robo);
 
gl_robo.vertexAttribPointer(
    colorLocation_robo,
    3,
    gl_robo.FLOAT,
    false,
    0,
    0
);
 
 
// --------------------------------------------------
// 9. LIMPAR TELA
// --------------------------------------------------
 
gl_robo.clearColor(0.1, 0.1, 0.1, 1.0);
 
gl_robo.clear(gl_robo.COLOR_BUFFER_BIT);
 
 
// --------------------------------------------------
// 10. DESENHAR
// --------------------------------------------------
 
gl_robo.useProgram(program_robo);
 
const numComponents_robo = 2;
 
gl_robo.drawArrays(
    gl_robo.TRIANGLES,
    0,
    vertices_robo.length / numComponents_robo
);
 