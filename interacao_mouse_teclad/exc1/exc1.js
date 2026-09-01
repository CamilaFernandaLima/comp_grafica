const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}


const canvasCoordinates =
    document.getElementById(
        "canvasCoordinates"
    );

const webglCoordinates =
    document.getElementById(
        "webglCoordinates"
    );

const colorBox =
    document.getElementById(
        "colorBox"
    );

const colorName =
    document.getElementById(
        "colorName"
    );


// --------------------------------------------------
// 1a. VERTICES
// --------------------------------------------------

let vertices = new Float32Array([0.0, 0.0]);


// --------------------------------------------------
// 1b. CORES
// --------------------------------------------------

let corAtual = [1.0, 0.0, 0.0];
let colors = new Float32Array(corAtual);


// --------------------------------------------------
// 1c. TAMANHO DOS PONTOS
// --------------------------------------------------

const TAMANHO_PONTO = 4.0;
let pointSizes = new Float32Array([TAMANHO_PONTO]);


// --------------------------------------------------
// 2. BUFFERS
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices,
    gl.STATIC_DRAW
);

const colorsBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    colors,
    gl.STATIC_DRAW
);

const pointSizesBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, pointSizesBuffer);

gl.bufferData(
    gl.ARRAY_BUFFER,
    pointSizes,
    gl.STATIC_DRAW
);


// --------------------------------------------------
// 3. VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;
in vec3 aColor;
in float aPointSize;

out vec3 vColor;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = aPointSize;
    vColor = aColor;
}

`;


// --------------------------------------------------
// 4. FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

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


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// 6. CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// 7. LOCAL DOS ATRIBUTOS
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getAttribLocation(
        program,
        "aColor"
    );

const pointSizeLocation =
    gl.getAttribLocation(
        program,
        "aPointSize"
    );


// --------------------------------------------------
// 8. CONFIGURAR ATRIBUTOS
// --------------------------------------------------

gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

gl.enableVertexAttribArray(colorLocation);

gl.vertexAttribPointer(
    colorLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
);

gl.bindBuffer(gl.ARRAY_BUFFER, pointSizesBuffer);

gl.enableVertexAttribArray(pointSizeLocation);

gl.vertexAttribPointer(
    pointSizeLocation,
    1,
    gl.FLOAT,
    false,
    0,
    0
);


// --------------------------------------------------
// 9. ALGORITMO DE BRESENHAM
// --------------------------------------------------
// Recebe dois pontos em coordenadas de pixel e devolve a lista de pixels que formam a linha entre eles.

function bresenham(x0, y0, x1, y1) {

    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const pixels = [];

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);

    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;

    let erro = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {

        pixels.push(x, y);

        if (x === x1 && y === y1) {
            break;
        }

        const erro2 = 2 * erro;

        if (erro2 > -dy) {
            erro -= dy;
            x += sx;
        }

        if (erro2 < dx) {
            erro += dx;
            y += sy;
        }
    }

    return pixels;
}


// Converte pixel para coordenadas normalizadas do WebGL (-1 a 1, origem no centro, Y invertido).
function pixelParaNDC(px, py) {
    const xNdc = (px / canvas.width) * 2 - 1;
    const yNdc = -((py / canvas.height) * 2 - 1);
    return [xNdc, yNdc];
}


// --------------------------------------------------
// 10. FUNÇÃO: DEFINIR A FIGURA ATUAL
// --------------------------------------------------
// Recebe uma lista de pixels, converte, joga no buffer de vértices e atualiza a aparência de cada vértice novo.

function definirFigura(pixels) {

    const novosVertices = [];

    for (let i = 0; i < pixels.length; i += 2) {
        const [xNdc, yNdc] = pixelParaNDC(pixels[i], pixels[i + 1]);
        novosVertices.push(xNdc, yNdc);
    }

    vertices = new Float32Array(novosVertices);

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        vertices,
        gl.STATIC_DRAW
    );

    atualizarAparencia();
    drawScene();
}


// --------------------------------------------------
// 11. FUNÇÃO: TRAÇAR LINHA
// --------------------------------------------------

function tracarLinha(x0, y0, x1, y1) {
    const pixels = bresenham(x0, y0, x1, y1);
    definirFigura(pixels);
}


// --------------------------------------------------
// 12. FUNÇÃO: MUDAR COR
// --------------------------------------------------
// Troca a cor atual pela cor indexada na paleta e redesenha a figura já existente com a cor nova.

function mudarCor(indice) {

    switch (indice) {
        case 0:
            corAtual = [1.0, 1.0, 1.0];
            colorBox.style.backgroundColor = "white";
            colorName.textContent = "branco";
            break;

        case 1:
            corAtual = [1.0, 0.0, 0.0];
            colorBox.style.backgroundColor = "red";
            colorName.textContent = "vermelho";
            break;

        case 2:
            corAtual = [0.0, 1.0, 0.0];
            colorBox.style.backgroundColor = "green";
            colorName.textContent = "verde";
            break;

        case 3:
            corAtual = [0.0, 0.0, 1.0];
            colorBox.style.backgroundColor = "blue";
            colorName.textContent = "azul";
            break;

        case 4:
            corAtual = [1.0, 1.0, 0.0];
            colorBox.style.backgroundColor = "yellow";
            colorName.textContent = "amarelo";
            break;

        case 5:
            corAtual = [1.0, 0.0, 1.0];
            colorBox.style.backgroundColor = "magenta";
            colorName.textContent = "magenta";
            break;

        case 6:
            corAtual = [0.0, 1.0, 1.0];
            colorBox.style.backgroundColor = "cyan";
            colorName.textContent = "ciano";
            break;

        case 7:
            corAtual = [1.0, 0.5, 0.0];
            colorBox.style.backgroundColor = "orange";
            colorName.textContent = "laranja";
            break;

        case 8:
            corAtual = [0.5, 0.0, 1.0];
            colorBox.style.backgroundColor = "purple";
            colorName.textContent = "roxo";
            break;

        case 9:
            corAtual = [1.0, 0.4, 0.7];
            colorBox.style.backgroundColor = "pink";
            colorName.textContent = "rosa";
            break;

        default:
            return;
    }

    atualizarAparencia();
    drawScene();
}


// --------------------------------------------------
// 13. ATUALIZAR BUFFERS DE COR E TAMANHO
// --------------------------------------------------
// Todos os pixels da figura atual usam a mesma cor e
// o mesmo tamanho, então repetimos os valores pra
// cada vértice antes de subir os buffers.

function atualizarAparencia() {

    const numVertices = vertices.length / 2;

    const novasCores = [];
    const novosTamanhos = [];

    for (let i = 0; i < numVertices; i++) {
        novasCores.push(corAtual[0], corAtual[1], corAtual[2]);
        novosTamanhos.push(TAMANHO_PONTO);
    }

    colors = new Float32Array(novasCores);
    pointSizes = new Float32Array(novosTamanhos);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        colors,
        gl.STATIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, pointSizesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        pointSizes,
        gl.STATIC_DRAW
    );
}


// --------------------------------------------------
// 14. INTERAÇÃO COM O MOUSE
// --------------------------------------------------
// Primeiro clique esquerdo = ponto inicial da linha.
// Segundo clique esquerdo = ponto final.

let pontoInicial = null;

canvas.addEventListener("mousedown", mouseClick, false);

function mouseClick(event) {

    if (event.button !== 0) {
        return; // ignora botão direito/meio
    }

    const x = event.offsetX;
    const y = event.offsetY;

    canvasCoordinates.textContent = `Canvas: (${x}, ${y})`;

    const [xNdc, yNdc] = pixelParaNDC(x, y);

    webglCoordinates.textContent =
        `WebGL: (${xNdc.toFixed(3)}, ${yNdc.toFixed(3)})`;

    if (pontoInicial === null) {
        pontoInicial = { x, y };
    } else {
        tracarLinha(pontoInicial.x, pontoInicial.y, x, y);
        pontoInicial = null;
    }
}


// --------------------------------------------------
// 15. INTERAÇÃO COM O TECLADO
// --------------------------------------------------

document.addEventListener("keydown", keyboardClick, false);

function keyboardClick(event) {

    switch (event.key) {
        case "0": mudarCor(0); break;
        case "1": mudarCor(1); break;
        case "2": mudarCor(2); break;
        case "3": mudarCor(3); break;
        case "4": mudarCor(4); break;
        case "5": mudarCor(5); break;
        case "6": mudarCor(6); break;
        case "7": mudarCor(7); break;
        case "8": mudarCor(8); break;
        case "9": mudarCor(9); break;
        default: return;
    }
}


// --------------------------------------------------
// 16. LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// 17. DESENHAR
// --------------------------------------------------

const numComponents = 2;

gl.useProgram(program);

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.drawArrays(
        gl.POINTS,
        0,
        vertices.length / numComponents
    );
}
