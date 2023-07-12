// Add UI

const {
    steps_per_frame, steps_per_frame_display, fDisplay,
    tDisplay, fpsDisplay, useFancyDisplay, paused,
    diffuseRadius, resetButton, diffuseRadiusDisplay
} = (function () {
    const masterContainer = addDiv(document.body, 'controls');

    const line1 = addDiv(masterContainer);
    addText(line1, 'Steps per frame: ');
    const steps_per_frame = addSlider(line1, 'steps-per-frame', 1, 8, 1, 4);
    const steps_per_frame_display = addDisplay(line1, 'steps-per-frame-display');

    const line2 = addDiv(masterContainer);
    const paused = addPlayPause(line2, 'play-pause');
    addText(line2, ' feedRate: ');
    const fDisplay = addDisplay(line2, 'feed-display');
    addText(line2, ', t = ');
    const tDisplay = addDisplay(line2, 'time-display');

    const line3 = addDiv(masterContainer);
    addText(line3, 'FPS: ');
    const fpsDisplay = addDisplay(line3, 'fps-display');

    const line4 = addDiv(masterContainer);
    addText(line4, 'Use Fancy Display: ')
    const useFancyDisplay = addSwitch(line4, 'use-fancy-text');

    const line5 = addDiv(masterContainer);
    addText(line5, 'Diffusion radius: ')
    const diffuseRadius = addSlider(line5, 'diffuse-radius', 1, 8, 1, 4);
    const diffuseRadiusDisplay = addDisplay(line5, 'diffuse-radius-display');

    const resetButton = addButton(masterContainer, 'reset-btn');
    addText(resetButton, "Reset Simulation");

    return {
        steps_per_frame, steps_per_frame_display, fDisplay,
        tDisplay, fpsDisplay, useFancyDisplay, paused,
        diffuseRadius, diffuseRadiusDisplay, resetButton
    }
})();

// Setup rendering

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const simulation = new Simulation(1200, 800);

const fpsCounter = new FPSCounter;

resetButton.onclick = _ => {
    simulation.resetSimulation();
}

function render() {
    fpsCounter.update();

    [canvas.width, canvas.height] = [canvas.clientWidth, canvas.clientHeight];
    ctx.fillStyle =  "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    simulation.nStepsPerFrame = +steps_per_frame.value;
    simulation.diffuseRadius = +diffuseRadius.value;
    simulation.useFancyRendering = useFancyDisplay.checked;

    simulation.feedRate = 0.02 * (Math.pow(2, 1.5 - simulation.simulationTime / 10) + 1);

    if(!paused.checked)
        simulation.update();

    ctx.drawImage(simulation.canvas, 0, 0, simulation.width, simulation.height);

    tDisplay.text = simulation.simulationTime.toFixed(1);
    fDisplay.text = simulation.feedRate.toFixed(3);
    fpsDisplay.text = fpsCounter.FPS.toFixed(0);
    steps_per_frame_display.text = ` ${simulation.nStepsPerFrame}`;
    diffuseRadiusDisplay.text = ` ${simulation.diffuseRadius}`;

    requestAnimationFrame(render)
}

render()