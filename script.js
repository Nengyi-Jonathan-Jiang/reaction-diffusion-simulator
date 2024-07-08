const {
    steps_per_frame, steps_per_frame_display,
    tDisplay, fpsDisplay, useFancyDisplay, paused,
    diffuseRadius, resetButton, diffuseRadiusDisplay,
    feedRate, feedRateDisplay,
    removeRate, removeRateDisplay,
    diffuseRateB, diffuseRateBDisplay
} = (function () {
    const masterContainer = addDiv(document.body, 'controls');

    const settingsIcon = document.createElement('input');
    settingsIcon.setAttribute('type', 'checkbox');
    settingsIcon.id = "settings-icon";
    const settingsIconLabel = document.createElement('label');
    settingsIconLabel.setAttribute('for', 'settings-icon');
    settingsIconLabel.id = "settings-icon-label";
    masterContainer.appendChild(settingsIconLabel);
    masterContainer.appendChild(settingsIcon);

    const line1 = addDiv(masterContainer);
    addText(line1, 'Steps per frame: ');
    const steps_per_frame = addSlider(line1, 'steps-per-frame', 1, 8, 1, 4);
    const steps_per_frame_display = addDisplay(line1, 'steps-per-frame-display');

    const line2 = addDiv(masterContainer);
    const paused = addPlayPause(line2, 'play-pause');
    addText(line2, 't = ');
    const tDisplay = addDisplay(line2, 'time-display');

    const line3 = addDiv(masterContainer);
    addText(line3, 'FPS: ');
    const fpsDisplay = addDisplay(line3, 'fps-display');

    const line4 = addDiv(masterContainer);
    addText(line4, 'Use Fancier Display: ')
    const useFancyDisplay = addSwitch(line4, 'use-fancy-text');

    const line5 = addDiv(masterContainer);
    addText(line5, 'Diffusion radius: ')
    const diffuseRadius = addSlider(line5, 'diffuse-radius', 1, 8, 1, (4, 1));
    const diffuseRadiusDisplay = addDisplay(line5, 'diffuse-radius-display');

    const line6 = addDiv(masterContainer);
    addText(line6, 'Relative diffusion rate: ')
    const diffuseRateB = addSlider(line6, 'diffuse-radius', .2, .8, 0.001, (0.5, 0.688));
    const diffuseRateBDisplay = addDisplay(line6, 'diffuse-radius-display');

    const line7 = addDiv(masterContainer);
    addText(line7, 'Feed rate: ')
    const feedRate = addSlider(line7, 'feed-rate', 0.0, 0.1, 0.001, (0.02, 0.036));
    const feedRateDisplay = addDisplay(line7, 'feed-rate-display');

    const line8 = addDiv(masterContainer);
    addText(line8, 'Remove rate: ')
    const removeRate = addSlider(line8, 'remove-rate', 0.03, 0.09, 0.001, (0.06, 0.057));
    const removeRateDisplay = addDisplay(line8, 'remove-rate-display');

    const resetButton = addButton(masterContainer, 'reset-btn');
    addText(resetButton, "Reset Simulation");

    return {
        steps_per_frame, steps_per_frame_display,
        tDisplay, fpsDisplay, useFancyDisplay, paused, feedRate, feedRateDisplay,
        diffuseRadius, diffuseRadiusDisplay, resetButton,
        removeRate, removeRateDisplay,
        diffuseRateB, diffuseRateBDisplay
    }
})();

// Setup rendering

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const simulation = new Simulation(1200, 600);

const fpsCounter = new FPSCounter;

resetButton.onclick = _ => {
    simulation.resetSimulation();
}

console.log(crossOriginIsolated);

function render() {
    fpsCounter.update();

    [canvas.width, canvas.height] = [canvas.clientWidth, canvas.clientHeight];
    ctx.fillStyle =  "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    simulation.nStepsPerFrame = +steps_per_frame.value;
    simulation.diffuseRadius = +diffuseRadius.value;
    simulation.diffuseRateB = +diffuseRateB.value;
    simulation.feedRate = +feedRate.value;
    simulation.removeRate = +removeRate.value;
    simulation.useFancyRendering = useFancyDisplay.checked;

    if(!paused.checked)
        simulation.update();

    ctx.drawImage(simulation.canvas, 0, 0, simulation.width, simulation.height);

    tDisplay.text = simulation.simulationTime.toFixed(1);
    fpsDisplay.text = `${fpsCounter.FPS.toFixed(0)}`;
    steps_per_frame_display.text = ` ${simulation.nStepsPerFrame}`;
    diffuseRadiusDisplay.text = ` ${simulation.diffuseRadius}`;
    feedRateDisplay.text = ` ${simulation.feedRate}`;
    removeRateDisplay.text = ` ${simulation.removeRate}`;
    diffuseRateBDisplay.text = ` ${simulation.diffuseRateB}`

    requestAnimationFrame(render)
}

render()