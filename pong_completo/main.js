const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0); // Center of the circle
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0,
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    0.0, 1.0, 0.0,
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 0.0, 0.0,
]);

// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);

let MbarraDireita = m3.translation(0.9, 0.0);

let MbolaCentro = m3.identity();

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

`;


// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}

`;


// --------------------------------------------------
// COMPILAR SHADERS
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
// CRIAR PROGRAMA
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
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

// --------------------------------------------------
// LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){
    
    atualizaAnimacao();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarraEsquerda(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length / numComponents
    );

}

function drawBarraDireita(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length / numComponents
    );

}

function drawBolaCentro(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBolaCentro
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length / numComponents
    );

}

// --------------------------------------------------
// DIMENSÕES DO CAMPO (usadas na colisão)
// --------------------------------------------------
// Valores tirados direto da geometria já definida acima:
// - As barras vão de -0.05 a 0.05 (largura) e -0.2 a 0.2 (altura) antes da translação.
// - A bola tem raio 0.05.
// - As barras ficam em x = -0.9 (esquerda) e x = 0.9 (direita).

const CAMPO_X = 0.9;
const BARRA_META_LARGURA = 0.05;
const BARRA_META_ALTURA = 0.2;
const BOLA_RAIO = 0.05;

const LIMITE_Y_BARRA = 1.0 - BARRA_META_ALTURA;

// Linha de "frente" de cada barra (onde a bola encosta)
const FRENTE_BARRA_DIREITA = CAMPO_X - BARRA_META_LARGURA;
const FRENTE_BARRA_ESQUERDA = -CAMPO_X + BARRA_META_LARGURA;

// --------------------------------------------------
// ESTADO DO JOGO
// --------------------------------------------------

let jogoAtivo = true;

const painelFimDeJogo = document.getElementById("painelFimDeJogo");
const mensagemFimEl = document.getElementById("mensagemFim");
const btnJogarNovamente = document.getElementById("btnJogarNovamente");

// Congela o jogo (bola e barras param de se mover) e mostra a mensagem.
function finalizarJogo(mensagem) {
    jogoAtivo = false;
    mensagemFimEl.textContent = mensagem;
    painelFimDeJogo.style.display = "block";
}

// --------------------------------------------------
// TECLADO (AS DUAS BARRAS SÃO CONTROLADAS PELO JOGADOR)
// --------------------------------------------------

const teclasPressionadas = {
    ArrowUp: false,
    ArrowDown: false,
    w: false,
    s: false
};

const TECLAS_CONTROLADAS = ["ArrowUp", "ArrowDown", "w", "W", "s", "S"];

window.addEventListener("keydown", function (event) {
    if (TECLAS_CONTROLADAS.includes(event.key)) {
        const tecla = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        teclasPressionadas[tecla] = true;
        event.preventDefault(); // evita rolar a página com as setas
    }
});

window.addEventListener("keyup", function (event) {
    if (TECLAS_CONTROLADAS.includes(event.key)) {
        const tecla = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        teclasPressionadas[tecla] = false;
    }
});

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO
// --------------------------------------------------

// Barra esquerda (controlada por W/S)
let tyBE = 0.0;

// Barra direita (controlada pelas setas)
let tyBD = 0.0;

const VELOCIDADE_JOGADOR = 0.02;

// Bola
let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.01;
let tyBola_offset = 0.002;

function moverBarraEsquerda() {

    if (teclasPressionadas.w) {
        tyBE += VELOCIDADE_JOGADOR;
    }
    if (teclasPressionadas.s) {
        tyBE -= VELOCIDADE_JOGADOR;
    }

    if (tyBE > LIMITE_Y_BARRA) {
        tyBE = LIMITE_Y_BARRA;
    } else if (tyBE < -LIMITE_Y_BARRA) {
        tyBE = -LIMITE_Y_BARRA;
    }

    MbarraEsquerda = m3.translation(-CAMPO_X, tyBE);
}

function moverBarraDireita() {

    if (teclasPressionadas.ArrowUp) {
        tyBD += VELOCIDADE_JOGADOR;
    }
    if (teclasPressionadas.ArrowDown) {
        tyBD -= VELOCIDADE_JOGADOR;
    }

    if (tyBD > LIMITE_Y_BARRA) {
        tyBD = LIMITE_Y_BARRA;
    } else if (tyBD < -LIMITE_Y_BARRA) {
        tyBD = -LIMITE_Y_BARRA;
    }

    MbarraDireita = m3.translation(CAMPO_X, tyBD);
}

// Recoloca a bola no centro pra começar uma partida nova
function resetarBola(direcao) {
    txBola = 0.0;
    tyBola = 0.0;
    txBola_offset = 0.01 * direcao;
    tyBola_offset = (Math.random() < 0.5 ? 1 : -1) * 0.002;
    MbolaCentro = m3.translation(txBola, tyBola);
}

// --------------------------------------------------
// JOGAR NOVAMENTE
// --------------------------------------------------

function jogarNovamente() {

    tyBE = 0.0;
    tyBD = 0.0;
    MbarraEsquerda = m3.translation(-CAMPO_X, tyBE);
    MbarraDireita = m3.translation(CAMPO_X, tyBD);

    resetarBola(Math.random() < 0.5 ? 1 : -1);

    painelFimDeJogo.style.display = "none";
    jogoAtivo = true;
}

btnJogarNovamente.addEventListener("click", jogarNovamente);

function moverBola() {

    // Movimento vertical + rebote no topo/fundo da tela
    tyBola += tyBola_offset;

    if (tyBola + BOLA_RAIO > 1.0 || tyBola - BOLA_RAIO < -1.0) {
        tyBola_offset = -tyBola_offset;
    }

    // Movimento horizontal
    txBola += txBola_offset;

    // Bola indo pra direita: checa a barra direita 
    if (txBola_offset > 0 && txBola + BOLA_RAIO >= FRENTE_BARRA_DIREITA) {

        const dentroDaBarra =
            tyBola >= tyBD - BARRA_META_ALTURA &&
            tyBola <= tyBD + BARRA_META_ALTURA;

        if (dentroDaBarra) {
            // Rebate: evita que a bola atravesse a barra
            txBola = FRENTE_BARRA_DIREITA - BOLA_RAIO;
            txBola_offset = -txBola_offset;
        } else {
            // Passou reto e bateu na parede de trás: fim de jogo
            MbolaCentro = m3.translation(txBola, tyBola);
            finalizarJogo("Jogador da esquerda venceu!");
            return;
        }
    }

    // Bola indo pra esquerda: checa a barra esquerda 
    if (txBola_offset < 0 && txBola - BOLA_RAIO <= FRENTE_BARRA_ESQUERDA) {

        const dentroDaBarra =
            tyBola >= tyBE - BARRA_META_ALTURA &&
            tyBola <= tyBE + BARRA_META_ALTURA;

        if (dentroDaBarra) {
            txBola = FRENTE_BARRA_ESQUERDA + BOLA_RAIO;
            txBola_offset = -txBola_offset;
        } else {
            // Passou reto e bateu na parede de trás: fim de jogo
            MbolaCentro = m3.translation(txBola, tyBola);
            finalizarJogo("Jogador da direita venceu!");
            return;
        }
    }

    MbolaCentro = m3.translation(txBola, tyBola);
}

function atualizaAnimacao(){

    if (!jogoAtivo) {
        return; // jogo parado, esperando o clique em "Jogar Novamente"
    }

    moverBarraEsquerda();
    moverBarraDireita();
    moverBola();
}


// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------

drawScene();