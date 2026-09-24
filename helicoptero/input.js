// ==================================================
// INPUT - TECLADO
// ==================================================
// Guarda o estado (pressionada/solta) de cada tecla.
// A Scene/Helicopter só perguntam: "essa tecla está
// pressionada agora?" a cada frame.

const Keyboard = {

    keysPressed: {},

    isDown(key) {
        return !!this.keysPressed[key];
    }
};

window.addEventListener("keydown", (event) => {

    // Evita que as setas rolem a página
    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();
    }

    Keyboard.keysPressed[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    Keyboard.keysPressed[event.key] = false;
});