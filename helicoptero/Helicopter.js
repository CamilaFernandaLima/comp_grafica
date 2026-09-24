// ==================================================
// CLASS - HELICOPTER
// ==================================================
// Encapsula as 5 peças do helicóptero e é responsável por:
//   - guardar a posição atual (x, y) do helicóptero na cena
//   - mover essa posição de acordo com as setas do teclado
//   - girar as duas hélices continuamente, independente
//     de o helicóptero estar se movendo ou não

class Helicopter {

    constructor() {

        // Peças (cada uma já sabe desenhar a si mesma)
        this.body = new HelicopterBody();
        this.topShaft = new HelicopterTopShaft();
        this.tail = new HelicopterTail();
        this.topPropellers = new HelicopterPropellers();
        this.tailPropeller = new HelicopterTailPropeller();

        // Posição do helicóptero no mundo
        this.x = 0.0;
        this.y = 0.0;

        // Velocidade de deslocamento (unidades por frame)
        this.moveSpeed = 0.02;

        // Limites simples para não deixar o helicóptero sair da tela
        this.limitX = 0.9;
        this.limitY = 0.9;

        // Ângulos atuais de cada hélice
        this.topPropellerTheta = 0.0;
        this.tailPropellerTheta = 0.0;

        // Velocidade de rotação de cada hélice (radianos/frame)
        this.topPropellerSpeed = 0.35;
        this.tailPropellerSpeed = 0.6;
    }

    // Lê o teclado e atualiza a posição
    handleMovement(keyboard) {

        if (keyboard.isDown("ArrowUp")) {
            this.y += this.moveSpeed;
        }
        if (keyboard.isDown("ArrowDown")) {
            this.y -= this.moveSpeed;
        }
        if (keyboard.isDown("ArrowLeft")) {
            this.x -= this.moveSpeed;
        }
        if (keyboard.isDown("ArrowRight")) {
            this.x += this.moveSpeed;
        }

        // Trava a posição dentro dos limites da tela
        this.x = Math.min(this.limitX, Math.max(-this.limitX, this.x));
        this.y = Math.min(this.limitY, Math.max(-this.limitY, this.y));
    }

    // Gira as hélices - sempre, mesmo parado
    spinPropellers() {
        this.topPropellerTheta += this.topPropellerSpeed;
        this.tailPropellerTheta += this.tailPropellerSpeed;
    }

    update(keyboard) {

        this.handleMovement(keyboard);
        this.spinPropellers();

        // Matriz que carrega a posição atual do helicóptero
        const translation = m4.translation(this.x, this.y, 0);

        // Peças rígidas: só acompanham a posição, não giram
        this.body.update(translation);
        this.topShaft.update(translation);
        this.tail.update(translation);

        // Hélice superior: gira em torno do eixo Y (rotor principal,
        // varre o plano horizontal) e é então deslocada para a
        // posição atual do helicóptero
        this.topPropellers.update(
            m4.translate(
                m4.yRotation(this.topPropellerTheta),
                this.x, this.y, 0
            )
        );

        // Hélice de cauda: gira em torno do eixo X (rotor de cauda,
        // varre o plano vertical lateral) e também acompanha a posição
        this.tailPropeller.update(
            m4.translate(
                m4.xRotation(this.tailPropellerTheta),
                this.x, this.y, 0
            )
        );
    }

    draw(renderer) {
        this.body.draw(renderer);
        this.topShaft.draw(renderer);
        this.tail.draw(renderer);
        this.topPropellers.draw(renderer);
        this.tailPropeller.draw(renderer);
    }
}