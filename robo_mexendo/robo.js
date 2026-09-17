const canvas_robo = document.getElementById("canvasRobo");
const gl_robo = canvas_robo.getContext("webgl2");

if (!gl_robo) {
    throw new Error("WebGL 2 não é suportado.");
}

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_viewTransform;
uniform mat3 u_modelTransform;

void main() {

    vec3 position =
        u_viewTransform *
        u_modelTransform *
        vec3(aPosition, 1.0);

    gl_Position =
        vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {

    outColor =
        vec4(uColor, 1.0);
}
`;

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

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {

    const vertexShader =
        createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    const fragmentShader =
        createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);

    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

        throw new Error(gl.getProgramInfoLog(program));
    }

    return program;
}


const program_robo =
    createProgram(
        gl_robo,
        vertexShaderSource,
        fragmentShaderSource
    );


// ==================================================
// CLASSE RENDERER
// ==================================================

class Renderer {

    constructor(gl, program) {

        this.gl = gl;

        this.program = program;

        this.positionLocation =
            gl.getAttribLocation(program, "aPosition");

        this.colorLocation =
            gl.getUniformLocation(program, "uColor");

        this.viewTransformLocation =
            gl.getUniformLocation(program, "u_viewTransform");

        this.modelTransformLocation =
            gl.getUniformLocation(program, "u_modelTransform");

        this.viewTransform = m3.identity();

        this.verticesBuffer = gl.createBuffer();
    }

    defineViewTransform(viewTransform) {

        this.viewTransform = viewTransform;
    }

    draw(object) {

        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);

        gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.positionLocation);

        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform3fv(this.colorLocation, object.color);

        gl.uniformMatrix3fv(this.modelTransformLocation, false, object.modelTransform);

        gl.uniformMatrix3fv(this.viewTransformLocation, false, this.viewTransform);

        gl.drawArrays(gl.TRIANGLES, 0, object.vertices.length / 2);
    }
}


// ==================================================
// AUXILIARY FUNCTION: RETÂNGULO = 2 TRIÂNGULOS
// ==================================================

function retangulo(x1, y1, x2, y2) {
    return [
        x1, y1, x2, y1, x2, y2,
        x1, y1, x2, y2, x1, y2
    ];
}


// ==================================================
// VERTICES DAS PARTES DO ROBÔ
// --------------------------------------------------
// Partes fixas mantêm as coordenadas originais.
// Braços e pernas são descritos em torno do seu
// ponto de articulação (ombro / quadril), que fica
// na origem (0,0) para permitir a rotação.
// ==================================================

function corpoVertices() {
    return new Float32Array(retangulo(-0.28, -0.45, 0.28, 0.1));
}

function cabecaVertices() {
    return new Float32Array(retangulo(-0.18, 0.1, 0.18, 0.4));
}

function olhoEsquerdoVertices() {
    return new Float32Array(retangulo(-0.08, 0.2, -0.02, 0.28));
}

function olhoDireitoVertices() {
    return new Float32Array(retangulo(0.02, 0.2, 0.08, 0.28));
}

function antenaVertices() {
    return new Float32Array(retangulo(-0.02, 0.4, 0.02, 0.55));
}

function bolinhaVertices() {
    return new Float32Array(retangulo(-0.04, 0.55, 0.04, 0.63));
}

// braço esquerdo: original (-0.40,-0.1) a (-0.28,0.03), ombro em (-0.28,0.03)
function bracoEsquerdoVertices() {
    return new Float32Array(retangulo(-0.12, -0.13, 0.0, 0.0));
}

// braço direito: original (0.28,-0.1) a (0.40,0.03), ombro em (0.28,0.03)
function bracoDireitoVertices() {
    return new Float32Array(retangulo(0.0, -0.13, 0.12, 0.0));
}

// pernas: original de y=-0.7 a y=-0.45, quadril em y=-0.45
function pernaVertices() {
    return new Float32Array(retangulo(-0.05, -0.25, 0.05, 0.0));
}


// ==================================================
// CLASSE SCENE OBJECT
// ==================================================

class SceneObject {

    constructor(vertices, color) {

        this.vertices = vertices;

        this.color = color;

        this.modelTransform = m3.identity();
    }

    updateModelTransform(modelTransform) {

        this.modelTransform = modelTransform;
    }
}


// ==================================================
// PARTES FIXAS (acompanham o robô sem movimento próprio)
// ==================================================

class Corpo extends SceneObject {
    constructor() {
        super(corpoVertices(), new Float32Array([0.25, 0.45, 0.65]));
    }
}

class Cabeca extends SceneObject {
    constructor() {
        super(cabecaVertices(), new Float32Array([0.30, 0.50, 0.70]));
    }
}

class Olho extends SceneObject {
    constructor(lado) {
        super(
            lado === "esquerdo"
                ? olhoEsquerdoVertices()
                : olhoDireitoVertices(),
            new Float32Array([0.3, 0.0, 0.5])
        );
    }
}

class Antena extends SceneObject {
    constructor() {
        super(antenaVertices(), new Float32Array([0.4, 0.4, 0.4]));
    }
}

class Bolinha extends SceneObject {
    constructor() {
        super(bolinhaVertices(), new Float32Array([0.8, 0.1, 0.1]));
    }
}


// ==================================================
// CLASSE MEMBRO (braços e pernas)
// --------------------------------------------------
// Estado: pivô, ângulo e velocidade angular.
// Comportamento: oscilar e se posicionar em relação
// ao robô -> M_membro = M_robo x M_local
// ==================================================

class Membro extends SceneObject {

    constructor(vertices, pivotX, pivotY, angularSpeed) {

        super(vertices, new Float32Array([0.2, 0.3, 0.5]));

        this.pivotX = pivotX;

        this.pivotY = pivotY;

        this.theta = 0.0;

        this.angularSpeed = angularSpeed;
    }

    updateRotation(dt) {

        this.theta += this.angularSpeed * dt;
    }

    updateModelTransform(roboTransform) {

        const localTransform =

            m3.multiply(
                m3.translation(this.pivotX, this.pivotY),
                m3.rotation(0.5 * Math.sin(this.theta))
            );

        this.modelTransform =

            m3.multiply(
                roboTransform,
                localTransform
            );
    }
}


class Braco extends Membro {

    constructor(lado, angularSpeed) {

        super(
            lado === "esquerdo"
                ? bracoEsquerdoVertices()
                : bracoDireitoVertices(),
            lado === "esquerdo" ? -0.28 : 0.28,
            0.03,
            angularSpeed
        );
    }
}


class Perna extends Membro {

    constructor(pivotX, angularSpeed) {

        super(pernaVertices(), pivotX, -0.45, angularSpeed);
    }
}


// ==================================================
// CLASSE ROBO
// --------------------------------------------------
// Composição: o robô TEM corpo, cabeça (com olhos,
// antena e bolinha), dois braços e duas pernas.
// ==================================================

class Robo {

    constructor(tx, ty, speed) {

        this.tx = tx;

        this.ty = ty;

        this.speed = speed;

        this.partesFixas = [
            new Corpo(),
            new Cabeca(),
            new Olho("esquerdo"),
            new Olho("direito"),
            new Antena(),
            new Bolinha()
        ];

        this.membros = [
            new Braco("esquerdo", 2.0),
            new Braco("direito", -2.0),
            new Perna(-0.10, -2.0),
            new Perna(0.10, 2.0)
        ];
    }

    move(dt) {

        this.tx += this.speed * dt;

        if (this.tx > 0.5 || this.tx < -0.5) {

            this.speed = -this.speed;
        }

        const roboTransform = m3.translation(this.tx, this.ty);

        for (const parte of this.partesFixas) {

            parte.updateModelTransform(roboTransform);
        }

        for (const membro of this.membros) {

            membro.updateRotation(dt);

            membro.updateModelTransform(roboTransform);
        }
    }

    draw(renderer) {

        for (const membro of this.membros) {
            renderer.draw(membro);
        }

        for (const parte of this.partesFixas) {
            renderer.draw(parte);
        }
    }
}


// ==================================================
// CLASSE SCENE
// ==================================================

class Scene {

    constructor(gl, program) {

        this.gl = gl;

        this.program = program;

        this.renderer = new Renderer(gl, program);

        this.viewTransform = m3.setClippingWindow(-1.0, -1.0, 1.0, 1.0);

        this.renderer.defineViewTransform(this.viewTransform);

        this.robo = new Robo(0.0, 0.05, 0.3);

        this.lastTime = 0.0;
    }

    update(dt) {

        this.robo.move(dt);
    }

    draw() {

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program);

        this.robo.draw(this.renderer);
    }

    execute(time) {

        const dt = Math.min((time - this.lastTime) / 1000, 0.1);

        this.lastTime = time;

        this.update(dt);

        this.draw();

        requestAnimationFrame((t) => this.execute(t));
    }

    init() {

        requestAnimationFrame((time) => {

            this.lastTime = time;

            this.execute(time);
        });
    }
}


// ==================================================
// CONFIGURAÇÃO INICIAL DO WEBGL
// ==================================================

gl_robo.clearColor(0.1, 0.1, 0.1, 1.0);

gl_robo.viewport(0, 0, canvas_robo.width, canvas_robo.height);


// ==================================================
// CRIAR CENA E INICIAR ANIMAÇÃO
// ==================================================

const scene = new Scene(gl_robo, program_robo);

scene.init();