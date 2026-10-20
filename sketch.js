let fairy;
let fairies = [];
let spirits = [];
let shadows = [];
let fireflies = [];
let butterflies = [];
let flowers = [];
let crystals = [];
let obstacles = [];
let gardenCircuit;
let gardenTrail;
let groundDetails = [];
let gameDebug = false;
let gameEnded = false;
let gamePaused = false;
let rescuedTotal = 0;
let rewardTotal = 0;
let generation = 1;
let toastUntil = 0;
let toastElement;
let sessionTime = 0;
let levelTime = 0;
let levelIndex = 0;
let difficultyMode = "adventure";
let simulationScale = 1;
let crystalsFound = 0;
let gardenLight = 0;
let gardenAudio;
let shadowSpawnTimer = 0;
let waveTimer = 0;
let waveNumber = 1;
let wavePending = 0;
let corruptionPatches = [];
let bestTimes = [];
const gardenSettings = {
  fairySpeed: 4.2,
  fairyForce: 0.2,
  fairyCount: 1,
  spiritSpeed: 1.7,
  shadowSpeed: 1.9,
  shadowPerception: 150,
  fireflyCohesion: 0.42,
  waveInterval: 30,
  collectibleCount: 4,
  shadowLimit: 3
};
const PREFERENCE_KEY = "enchantedGarden.preferences.v1";
const BEST_TIMES_KEY = "enchantedGarden.bestTimes.v1";
const LEVELS = [
  { name: "CHAPITRE I · LE JARDIN ENDORMI", world: "VALLÉE DES LUCIOLES", duration: 30, background: ["#fff1fb", "#d9f4dc", "#b5e6d7"] },
  { name: "CHAPITRE II · LE BOSQUET ROSÉ", world: "BOSQUET DES PÉTALES", duration: 27, background: ["#fff0f8", "#f5d8eb", "#c6e8d9"] },
  { name: "CHAPITRE III · LE LAC DE LUNE", world: "LAC DE LUNE", duration: 24, background: ["#f4f0ff", "#dce5ff", "#b8e2ee"] }
];
let GOAL_CRYSTALS = gardenSettings.collectibleCount;
let GOAL_FLOWERS = gardenSettings.collectibleCount;
const GOAL_SPIRITS = 3;
const FLOWER_LAYOUT = [
  [0.35, 0.28, "#f18cc2"],
  [0.58, 0.31, "#d9a2f2"],
  [0.69, 0.58, "#f4a5cf"],
  [0.43, 0.72, "#e987b8"],
  [0.77, 0.34, "#e9b9f0"]
];
const CRYSTAL_LAYOUT = [
  [0.31, 0.48], [0.44, 0.37], [0.56, 0.54],
  [0.68, 0.73], [0.79, 0.49]
];
const CRYSTAL_HUES = [326, 286, 310, 267, 338];

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.elt.setAttribute("aria-label", "Jardin enchanté interactif. Cliquez pour déplacer les fées.");
  colorMode(RGB, 255, 255, 255, 255);
  pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5));
  toastElement = document.querySelector("#toast");
  gardenAudio = new GardenAudio();
  loadGardenPreferences();
  gardenAudio.setMusicVolume(gardenSettings.musicVolume);
  loadBestTimes();
  initializeGarden();
  bindInterface();
  syncSettingControls();
  describe("Jeu de jardin enchanté : une fée récolte des cristaux, réveille des fleurs et protège des esprits contre des ombres autonomes.");
}

function initializeGarden(nextLevel = levelIndex, newRun = true) {
  levelIndex = Math.max(0, Math.min(LEVELS.length - 1, nextLevel));
  const fairyStart = createVector(width * 0.48, height * 0.52);
  fairies = Array.from({ length: gardenSettings.fairyCount }, (_, index) => {
    const angle = TWO_PI * index / gardenSettings.fairyCount;
    const distance = index === 0 ? 0 : 28;
    const companion = new GardenFairy(
      fairyStart.x + Math.cos(angle) * distance,
      fairyStart.y + Math.sin(angle) * distance
    );
    companion.maxSpeed = gardenSettings.fairySpeed;
    companion.maxForce = gardenSettings.fairyForce;
    companion.setDestination(fairyStart);
    return companion;
  });
  fairy = fairies[0];
  spirits = [];
  shadows = [];
  fireflies = [];
  butterflies = [];
  flowers = [];
  crystals = [];
  corruptionPatches = [];
  obstacles = [];
  rescuedTotal = 0;
  generation = 1;
  levelTime = 0;
  crystalsFound = 0;
  gardenLight = 0;
  if (newRun) {
    sessionTime = 0;
    rewardTotal = 0;
  }
  shadowSpawnTimer = 0;
  waveTimer = 0;
  waveNumber = 1;
  wavePending = 0;
  gamePaused = false;
  gameEnded = false;

  GOAL_CRYSTALS = crystalGoalFor(gardenSettings.collectibleCount);
  GOAL_FLOWERS = gardenSettings.collectibleCount;
  flowers = FLOWER_LAYOUT.slice(0, gardenSettings.collectibleCount).map(([x, y, hue], index) => {
    const point = levelPoint(x, y);
    return new GardenFlower(width * point.x, height * point.y, color(hue), index);
  });

  crystals = CRYSTAL_LAYOUT.slice(0, gardenSettings.collectibleCount).map(([x, y], index) => {
    const point = levelPoint(x, y);
    return new MagicCrystal(width * point.x, height * point.y, CRYSTAL_HUES[index]);
  });

  obstacles = [
    [0.29, 0.34, 24], [0.48, 0.24, 18], [0.63, 0.46, 27],
    [0.36, 0.61, 21], [0.76, 0.68, 25], [0.54, 0.76, 16],
    [0.83, 0.42, 19]
  ].map(([x, y, radius]) => ({ pos: createVector(width * x, height * y), radius }));

  const loop = [];
  for (let index = 0; index < 18; index += 1) {
    const angle = TWO_PI * index / 18;
    const wobble = 1 + 0.09 * Math.sin(angle * 3) + 0.05 * Math.cos(angle * 5);
    loop.push(createVector(
      width * 0.56 + Math.cos(angle) * width * 0.26 * wobble,
      height * 0.53 + Math.sin(angle) * height * 0.33 * wobble
    ));
  }
  gardenCircuit = new GardenPath(loop, 30, true);
  gardenTrail = new GardenPath([
    createVector(width * 0.29, height * 0.52),
    createVector(width * 0.48, height * 0.47),
    createVector(width * 0.69, height * 0.53)
  ], 38, false);

  for (let index = 0; index < 3; index += 1) {
    const starts = [[0.34, 0.47], [0.53, 0.72], [0.75, 0.43]];
    const spirit = new GardenSpirit(width * starts[index][0], height * starts[index][1]);
    spirit.maxSpeed = gardenSettings.spiritSpeed * (difficultyMode === "calm" ? 1.08 : 1);
    assignHomeTrail(spirit);
    spirits.push(spirit);
  }
  shadows = Array.from({ length: Math.min(1, gardenSettings.shadowLimit) }, (_, index) => createShadow(index));
  for (let index = 0; index < 28; index += 1) {
    fireflies.push(new GardenFirefly(random(width * 0.29, width * 0.82), random(height * 0.22, height * 0.83), index));
  }
  for (let index = 0; index < 13; index += 1) {
    const flower = flowers[index % flowers.length];
    butterflies.push(new GardenButterfly(
      flower.pos.x + random(-55, 55),
      flower.pos.y + random(-42, 42),
      index
    ));
  }
  groundDetails = [];
  for (let index = 0; index < 230; index += 1) {
    groundDetails.push({
      x: random(width), y: random(height), size: random(1, 4),
      color: random(["#fff4c7", "#fff9e8", "#f6d9ee", "#c9f0dc", "#c9dcff"]),
      alpha: random(28, 92)
    });
  }
  updateHud();
  document.querySelector("#end-screen").hidden = true;
  document.querySelector("#pause-overlay").hidden = true;
  document.querySelector("#pause-toggle").textContent = "Ⅱ PAUSE";
  document.querySelector("#pause-toggle").setAttribute("aria-pressed", "false");
  document.querySelector("#level-name").textContent = LEVELS[levelIndex].name;
  document.querySelector(".world-label").innerHTML = `<span class="world-dot"></span> ${LEVELS[levelIndex].world}`;
  updateBestTime();
}

function crystalGoalFor(count) {
  let total = 0;
  for (let index = 0; index < count; index += 1) total += 2 + index % 2;
  return total;
}

function levelPoint(x, y) {
  if (levelIndex === 1) return { x: 1 - x, y: 1 - y };
  if (levelIndex === 2) return { x: y, y: 1 - x };
  return { x, y };
}

function assignHomeTrail(spirit) {
  const nearestFlower = flowers.reduce((closest, flower) =>
    !closest || p5.Vector.dist(spirit.pos, flower.pos) < p5.Vector.dist(spirit.pos, closest.pos)
      ? flower : closest, null);
  spirit.homePath = new GardenPath([spirit.pos.copy(), nearestFlower.pos.copy()], 34, false);
}

function bindInterface() {
  document.querySelector("#sound-toggle").addEventListener("click", event => {
    const enabled = gardenAudio.toggle();
    event.currentTarget.innerHTML = `${enabled ? "♫" : "×"} <span>${enabled ? "SON" : "MUET"}</span>`;
    event.currentTarget.setAttribute("aria-pressed", String(enabled));
  });
  document.querySelector("#restart-button").addEventListener("click", () => initializeGarden());
  document.querySelector("#next-level-button").addEventListener("click", () => {
    if (levelIndex < LEVELS.length - 1) initializeGarden(levelIndex + 1, false);
  });
  document.querySelector("#pause-toggle").addEventListener("click", togglePause);
  document.querySelector("#debug-toggle").addEventListener("click", event => {
    gameDebug = !gameDebug;
    event.currentTarget.setAttribute("aria-pressed", String(gameDebug));
  });
  bindSettingSlider("fairy-speed", "fairy-speed-value", value => {
    gardenSettings.fairySpeed = value;
    fairies.forEach(agent => { agent.maxSpeed = value; });
  }, value => value.toFixed(1).replace(".", ","));
  bindSettingSlider("fairy-count", "fairy-count-value", value => setFairyCount(value), String);
  bindSettingSlider("music-volume", "music-volume-value", value => {
    gardenSettings.musicVolume = value;
    gardenAudio.setMusicVolume(value);
  }, value => `${Math.round(value * 100)} %`);
  bindSettingSlider("fairy-force", "fairy-force-value", value => {
    gardenSettings.fairyForce = value;
    if (fairy) fairy.maxForce = value;
  }, value => value.toFixed(2).replace(".", ","));
  bindSettingSlider("spirit-speed", "spirit-speed-value", value => {
    gardenSettings.spiritSpeed = value;
    spirits.forEach(spirit => { spirit.maxSpeed = value * (difficultyMode === "calm" ? 1.08 : 1); });
  }, value => value.toFixed(1).replace(".", ","));
  bindSettingSlider("shadow-speed", "shadow-speed-value", value => {
    gardenSettings.shadowSpeed = value;
    applyDifficulty();
  }, value => value.toFixed(1).replace(".", ","));
  bindSettingSlider("shadow-perception", "shadow-perception-value", value => {
    gardenSettings.shadowPerception = value;
  }, value => `${Math.round(value)} px`);
  bindSettingSlider("firefly-cohesion", "firefly-cohesion-value", value => {
    gardenSettings.fireflyCohesion = value;
  }, value => value.toFixed(2).replace(".", ","));
  bindSettingSlider("wave-interval", "wave-interval-value", value => {
    gardenSettings.waveInterval = value;
  }, value => `${Math.round(value)} s`);
  bindSettingSlider("garden-count", "garden-count-value", value => setGardenCount(value), value => String(value));
  bindSettingSlider("shadow-limit", "shadow-limit-value", value => {
    setShadowLimit(value);
  }, value => String(value));
  document.querySelector("#difficulty").addEventListener("change", event => {
    difficultyMode = event.currentTarget.value;
    applyDifficulty();
    saveGardenPreferences();
  });
  document.querySelector("#time-scale").addEventListener("change", event => {
    simulationScale = Number(event.currentTarget.value);
    saveGardenPreferences();
  });
  window.addEventListener("keydown", event => {
    if (event.target?.matches("input, button, summary, a, textarea, select")) return;
    if (event.key === " ") event.preventDefault();
    if (event.repeat) return;
    if (event.key.toLowerCase() === "p" || event.key === "Escape") {
      togglePause();
      return;
    }
  });
}

function bindSettingSlider(inputId, outputId, onChange, format) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  input.addEventListener("input", () => {
    const value = Number(input.value);
    onChange(value);
    output.value = format(value);
    output.textContent = format(value);
    saveGardenPreferences();
  });
}

function syncSettingControls() {
  for (const [inputId, outputId, value, format] of [
    ["music-volume", "music-volume-value", gardenSettings.musicVolume, value => `${Math.round(value * 100)} %`],
    ["fairy-count", "fairy-count-value", gardenSettings.fairyCount, String],
    ["fairy-speed", "fairy-speed-value", gardenSettings.fairySpeed, value => value.toFixed(1).replace(".", ",")],
    ["fairy-force", "fairy-force-value", gardenSettings.fairyForce, value => value.toFixed(2).replace(".", ",")],
    ["spirit-speed", "spirit-speed-value", gardenSettings.spiritSpeed, value => value.toFixed(1).replace(".", ",")],
    ["shadow-speed", "shadow-speed-value", gardenSettings.shadowSpeed, value => value.toFixed(1).replace(".", ",")],
    ["shadow-perception", "shadow-perception-value", gardenSettings.shadowPerception, value => `${Math.round(value)} px`],
    ["firefly-cohesion", "firefly-cohesion-value", gardenSettings.fireflyCohesion, value => value.toFixed(2).replace(".", ",")],
    ["wave-interval", "wave-interval-value", gardenSettings.waveInterval, value => `${Math.round(value)} s`],
    ["garden-count", "garden-count-value", gardenSettings.collectibleCount, String],
    ["shadow-limit", "shadow-limit-value", gardenSettings.shadowLimit, String]
  ]) {
    document.getElementById(inputId).value = String(value);
    const output = document.getElementById(outputId);
    output.value = format(value);
    output.textContent = format(value);
  }
  document.querySelector("#difficulty").value = difficultyMode;
  document.querySelector("#time-scale").value = String(simulationScale);
}

function setFairyCount(count) {
  count = Math.round(Math.max(1, Math.min(6, count)));
  gardenSettings.fairyCount = count;
  if (fairy) {
    fairies.length = Math.min(fairies.length, count);
    while (fairies.length < count) {
      const index = fairies.length;
      const angle = TWO_PI * index / count;
      const distance = 28 + Math.floor((index - 1) / 6) * 18;
      const companion = new GardenFairy(
        fairy.pos.x + Math.cos(angle) * distance,
        fairy.pos.y + Math.sin(angle) * distance
      );
      companion.maxSpeed = gardenSettings.fairySpeed;
      companion.maxForce = gardenSettings.fairyForce;
      companion.setDestination(fairy.destination);
      fairies.push(companion);
    }
    updateHud();
  }
  saveGardenPreferences();
}

function setGardenCount(count) {
  count = Math.round(Math.max(1, Math.min(5, count)));
  gardenSettings.collectibleCount = count;
  GOAL_CRYSTALS = crystalGoalFor(count);
  GOAL_FLOWERS = count;
  flowers = FLOWER_LAYOUT.slice(0, count).map(([x, y, hue], index) => {
    const point = levelPoint(x, y);
    return new GardenFlower(width * point.x, height * point.y, color(hue), index);
  });
  crystals = CRYSTAL_LAYOUT.slice(0, count).map(([x, y], index) => {
    const point = levelPoint(x, y);
    return new MagicCrystal(width * point.x, height * point.y, CRYSTAL_HUES[index]);
  });
  crystalsFound = 0;
  if (fairy) fairy.crystalInventory = 0;
  for (const spirit of spirits) assignHomeTrail(spirit);
  saveGardenPreferences();
  updateHud();
}

function setShadowLimit(limit) {
  limit = Math.round(Math.max(1, Math.min(6, limit)));
  gardenSettings.shadowLimit = limit;
  while (shadows.length > limit) shadows.pop();
  shadowSpawnTimer = 0;
  wavePending = Math.min(wavePending, Math.max(0, limit - shadows.length));
}

function createShadow(index) {
  const spots = [[0.72, 0.43], [0.39, 0.79], [0.82, 0.72], [0.23, 0.76], [0.86, 0.3], [0.52, 0.18]];
  const spot = spots[index % spots.length];
  const shadow = new ShadowCreature(width * spot[0], height * spot[1], index);
  shadow.maxSpeed = gardenSettings.shadowSpeed * (difficultyMode === "calm" ? 0.72 : 1) * (1 + Math.max(0, waveNumber - 1) * 0.035);
  return shadow;
}

function loadGardenPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFERENCE_KEY) || "{}");
    const ranges = {
      fairySpeed: [1, 8, 4.2],
      fairyForce: [0.05, 0.5, 0.2],
      musicVolume: [0, 1, 0.35],
      spiritSpeed: [0.5, 4, 1.7],
      shadowSpeed: [0.5, 4, 1.9],
      fairyCount: [1, 6, 1, true],
      shadowPerception: [60, 220, 150],
      fireflyCohesion: [0, 2, 0.42],
      waveInterval: [15, 60, 30, true],
      collectibleCount: [1, 5, 4, true],
      shadowLimit: [1, 6, 3, true]
    };
    for (const [key, [minimum, maximum, fallback, integer = false]] of Object.entries(ranges)) {
      const value = Number(saved[key]);
      const normalized = Number.isFinite(value)
        ? Math.max(minimum, Math.min(maximum, value))
        : fallback;
      gardenSettings[key] = integer ? Math.round(normalized) : normalized;
    }
    difficultyMode = ["calm", "adventure"].includes(saved.difficulty) ? saved.difficulty : "adventure";
    const scale = Number(saved.timeScale);
    simulationScale = [0.5, 1, 1.5].includes(scale) ? scale : 1;
  } catch (error) {
    console.warn("Impossible de charger les préférences du jardin.", error);
  }
}

function saveGardenPreferences() {
  try {
    localStorage.setItem(PREFERENCE_KEY, JSON.stringify({
      ...gardenSettings,
      difficulty: difficultyMode,
      timeScale: simulationScale || Number(document.querySelector("#time-scale").value) || 1
    }));
  } catch (error) {
    console.warn("Impossible d’enregistrer les préférences du jardin.", error);
  }
}

function loadBestTimes() {
  try {
    const stored = JSON.parse(localStorage.getItem(BEST_TIMES_KEY) || "[]");
    bestTimes = Array.isArray(stored) ? LEVELS.map((_, index) => {
      const value = Number(stored[index]);
      return Number.isFinite(value) && value > 0 ? value : null;
    }) : LEVELS.map(() => null);
  } catch (error) {
    bestTimes = LEVELS.map(() => null);
    console.warn("Impossible de charger les records du jardin.", error);
  }
}

function saveBestTime() {
  if (bestTimes[levelIndex] === null || levelTime < bestTimes[levelIndex]) {
    bestTimes[levelIndex] = levelTime;
    try {
      localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(bestTimes));
    } catch (error) {
      console.warn("Impossible d’enregistrer le record du jardin.", error);
    }
  }
  updateBestTime();
}

function updateBestTime() {
  const best = bestTimes[levelIndex];
  document.querySelector("#best-time").textContent = best === null || best === undefined
    ? "—"
    : formatTime(best);
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function applyDifficulty() {
  for (const spirit of spirits) spirit.maxSpeed = gardenSettings.spiritSpeed * (difficultyMode === "calm" ? 1.08 : 1);
  for (const shadow of shadows) shadow.maxSpeed = gardenSettings.shadowSpeed
    * (difficultyMode === "calm" ? 0.72 : 1)
    * (1 + Math.max(0, waveNumber - 1) * 0.035);
}

function togglePause() {
  if (gameEnded) return;
  gamePaused = !gamePaused;
  simulationScale = gamePaused ? 0 : Number(document.querySelector("#time-scale").value);
  document.querySelector("#pause-overlay").hidden = !gamePaused;
  const button = document.querySelector("#pause-toggle");
  button.textContent = gamePaused ? "▶ REPRENDRE" : "Ⅱ PAUSE";
  button.setAttribute("aria-pressed", String(gamePaused));
}

function mousePressed(event) {
  if (event.target?.tagName !== "CANVAS") return;
  setFairyDestinationFromPointer(mouseX, mouseY);
}

function touchStarted(event) {
  if (event.target?.tagName !== "CANVAS" || touches.length === 0) return;
  setFairyDestinationFromPointer(touches[0].x, touches[0].y);
  return false;
}

function setFairyDestinationFromPointer(x, y) {
  if (gameEnded || gamePaused || !fairy) return;
  const destination = createVector(constrain(x, 14, width - 14), constrain(y, 14, height - 14));
  fairies.forEach(agent => agent.setDestination(destination));
}

function drawFairyDestination() {
  if (!fairy || p5.Vector.dist(fairy.pos, fairy.destination) < 18) return;
  const pulse = 1 + Math.sin(millis() * 0.008) * 0.16;
  push();
  translate(fairy.destination.x, fairy.destination.y);
  noFill();
  stroke(255, 231, 166, 190);
  strokeWeight(1.5);
  circle(0, 0, 24 * pulse);
  stroke(255, 177, 218, 150);
  circle(0, 0, 12);
  noStroke();
  fill(255, 247, 209, 230);
  starShape(0, 0, 2, 5 * pulse, 4);
  pop();
}

function keyPressed() {
  if (document.activeElement?.matches("input, button, summary, a, textarea, select")) return;
  if (key === "g" || key === "G") {
    gameDebug = !gameDebug;
    document.querySelector("#debug-toggle").setAttribute("aria-pressed", String(gameDebug));
  }
  if (gamePaused || gameEnded) return false;
  if (key === "e" || key === "E") wakeNearbyFlower();
  if (key === "f" || key === "F") protectNearbySpirit();
  if (key === " ") castWard();
  if (key === " ") return false;
}

function draw() {
  const frameDt = Math.min(Math.max((deltaTime || 16.67) / 1000, 0), 0.05);
  const dt = gamePaused ? 0 : frameDt * Number(document.querySelector("#time-scale").value);
  simulationScale = gamePaused ? 0 : Number(document.querySelector("#time-scale").value);
  if (!gameEnded && !gamePaused) {
    sessionTime += dt;
    levelTime += dt;
  }
  drawGardenGround();
  drawFairyDestination();
  gardenCircuit.show(gameDebug);
  gardenTrail.show(false);
  drawObstacles();
  for (const patch of corruptionPatches) patch.show();
  for (const crystal of crystals) crystal.show();
  for (const flower of flowers) flower.show();
  for (const firefly of fireflies) firefly.show();
  for (const butterfly of butterflies) butterfly.show();

  if (!gameEnded) {
    if (!gamePaused) {
      for (const agent of fairies) {
        agent.updateAI(obstacles, dt, fairies);
        agent.integrate(width, height);
      }
      updateCrystals(dt);
      updateFlowers(dt);
      updateCorruption(dt);
      updateSpirits(dt);
      updateShadows(dt);
      updateFireflies();
      updateButterflies();
      checkVictory();
    }
  }

  for (const spirit of spirits) spirit.show();
  for (const shadow of shadows) shadow.show();
  for (const agent of fairies) agent.show();
  updateClock();
  updateHud();
  updateGuidance();
  updateInteractionPrompt();
  if (millis() > toastUntil) toastElement.classList.remove("visible");
}

function drawGardenGround() {
  background("#e9e3f3");
  const gradient = drawingContext.createRadialGradient(width * 0.53, height * 0.51, 20, width * 0.53, height * 0.51, Math.max(width, height) * 0.78);
  gradient.addColorStop(0, LEVELS[levelIndex].background[0]);
  gradient.addColorStop(0.33, LEVELS[levelIndex].background[1]);
  gradient.addColorStop(0.68, LEVELS[levelIndex].background[2]);
  gradient.addColorStop(1, "#c8bddf");
  drawingContext.fillStyle = gradient;
  drawingContext.fillRect(0, 0, width, height);
  if (flowers.length > 0 && flowers.every(flower => flower.awake)) {
    gardenLight = Math.min(1, gardenLight + (deltaTime || 16.67) / 1200);
  }
  if (gardenLight > 0) {
    const radiance = drawingContext.createRadialGradient(
      width * 0.52, height * 0.5, 0,
      width * 0.52, height * 0.5, Math.max(width, height) * 0.82
    );
    radiance.addColorStop(0, `rgba(255, 250, 218, ${0.42 * gardenLight})`);
    radiance.addColorStop(0.55, `rgba(255, 244, 214, ${0.32 * gardenLight})`);
    radiance.addColorStop(1, `rgba(255, 251, 229, ${0.58 * gardenLight})`);
    drawingContext.fillStyle = radiance;
    drawingContext.fillRect(0, 0, width, height);
  }
  noStroke();
  const lightPools = [
    [0.25, 0.29, 235, 190, 236, 16],
    [0.78, 0.3, 255, 211, 239, 14],
    [0.73, 0.76, 190, 235, 217, 16],
    [0.31, 0.77, 205, 217, 255, 13]
  ];
  for (const [x, y, redValue, greenValue, blueValue, alpha] of lightPools) {
    noStroke();
    fill(redValue, greenValue, blueValue, alpha);
    circle(width * x, height * y, Math.min(width, height) * 0.38);
  }
  for (const detail of groundDetails) {
    fill(detail.color + Math.round(detail.alpha).toString(16).padStart(2, "0"));
    circle(detail.x, detail.y, detail.size);
  }
  for (let ring = 0; ring < 5; ring += 1) {
    noFill();
    stroke(232, 147, 206, 22 - ring * 3);
    strokeWeight(1);
    ellipse(width * 0.56, height * 0.53, width * (0.16 + ring * 0.08), height * (0.19 + ring * 0.08));
  }
  noStroke();
}

function drawObstacles() {
  for (const obstacle of obstacles) {
    push();
    noStroke();
    fill(10, 19, 20, 50);
    ellipse(obstacle.pos.x + 3, obstacle.pos.y + 7, obstacle.radius * 2.1, obstacle.radius * 1.3);
    fill("#52645a");
    ellipse(obstacle.pos.x, obstacle.pos.y, obstacle.radius * 1.8, obstacle.radius * 1.15);
    fill("#758674");
    ellipse(obstacle.pos.x - obstacle.radius * 0.18, obstacle.pos.y - obstacle.radius * 0.16, obstacle.radius * 0.75, obstacle.radius * 0.42);
    pop();
    if (gameDebug) {
      noFill(); stroke("#f1dd9a88");
      circle(obstacle.pos.x, obstacle.pos.y, (obstacle.radius + 13) * 2);
    }
  }
}

function updateCrystals(dt) {
  for (const crystal of crystals) {
    crystal.update(dt);
    const collector = fairies.find(agent => p5.Vector.dist(agent.pos, crystal.pos) < 25);
    if (!crystal.collected && crystalsFound < GOAL_CRYSTALS && collector) {
      crystal.collect(4);
      crystalsFound += 1;
      fairy.crystalInventory += 1;
      fairy.energy = Math.min(fairy.maxEnergy, fairy.energy + 1);
      gardenAudio.play("crystal");
      showToast(`Fragment récolté · ${fairy.crystalInventory} en poche`);
    }
  }
}

function updateFlowers(dt) {
  for (const flower of flowers) flower.update(dt);
}

function updateCorruption(dt) {
  corruptionPatches = corruptionPatches.filter(patch => !patch.update(dt, spirits));
}

function wakeNearbyFlower() {
  if (!fairy || gameEnded) return;
  const target = flowers
    .filter(item => !item.awake)
    .map(flower => ({ flower, agent: nearestFairyTo(flower.pos) }))
    .filter(item => item.agent && p5.Vector.dist(item.agent.pos, item.flower.pos) < 72)
    .sort((a, b) => p5.Vector.dist(a.agent.pos, a.flower.pos) - p5.Vector.dist(b.agent.pos, b.flower.pos))[0];
  if (!target) {
    showToast("Approchez-vous d’une fleur endormie");
    return;
  }
  const { flower } = target;
  if (fairy.crystalInventory < 1) {
    showToast("Récoltez un fragment avant de nourrir la fleur");
    return;
  }
  fairy.crystalInventory -= 1;
  flower.feedCrystal();
  if (!flower.awake) {
    gardenAudio.play("crystal");
    showToast(`Énergie florale · ${flower.crystalsFed}/${flower.crystalsNeeded} fragments`);
    return;
  }
  gardenAudio.play("bloom");
  gardenAudio.play("reward");
  rewardTotal += 1;
  generation += 1;
  const parent = spirits.slice().sort((a, b) => (b.fitness + b.health) - (a.fitness + a.health))[0];
  if (parent && spirits.length < 6) {
    const child = new GardenSpirit(flower.pos.x + random(-24, 24), flower.pos.y + random(-24, 24), parent.dna);
    child.maxSpeed = gardenSettings.spiritSpeed * (difficultyMode === "calm" ? 1.08 : 1);
    assignHomeTrail(child);
    spirits.push(child);
    showToast("La fleur éclot · une nouvelle lignée hérite de gènes mutés");
  } else {
    showToast("La fleur s’épanouit · les esprits sont revigorés");
  }
  spirits.forEach(spirit => { spirit.health = Math.min(100, spirit.health + 20); });
}

function castWard() {
  if (!fairy || gameEnded) return;
  if (!fairy.castWard()) {
    showToast(fairy.energy < 1 ? "Pas assez d’énergie · trouvez un cristal" : "La lumière se recharge");
    return;
  }
  for (const shadow of shadows) {
    if (p5.Vector.dist(shadow.pos, fairy.pos) < 145) shadow.stunTimer = Math.max(shadow.stunTimer, 0.85);
  }
  const patchCount = corruptionPatches.length;
  corruptionPatches = corruptionPatches.filter(patch => !patch.contains(fairy.pos, 90));
  gardenAudio.play("ward");
  showToast(patchCount > corruptionPatches.length
    ? "Onde protectrice · une zone de corruption est purifiée"
    : "Onde protectrice · les ombres reculent");
}

function protectNearbySpirit() {
  if (!fairy || gameEnded) return;
  const target = spirits
    .filter(item => !item.rescued && item.health > 0)
    .map(spirit => ({ spirit, agent: nearestFairyTo(spirit.pos) }))
    .filter(item => item.agent && p5.Vector.dist(item.agent.pos, item.spirit.pos) < 70)
    .sort((a, b) => p5.Vector.dist(a.agent.pos, a.spirit.pos) - p5.Vector.dist(b.agent.pos, b.spirit.pos))[0];
  if (!target) {
    showToast("Approchez-vous d’un esprit libre pour le protéger");
    return;
  }
  const { spirit } = target;
  const nearbyShadow = shadows.some(shadow => p5.Vector.dist(shadow.pos, spirit.pos) < 85);
  if (nearbyShadow) {
    showToast("Éloignez les ombres avant de protéger cet esprit");
    return;
  }
  spirit.rescued = true;
  spirit.health = 100;
  rescuedTotal += 1;
  rewardTotal += 2;
  gardenAudio.play("rescue");
  gardenAudio.play("reward");
  showToast("Esprit protégé · +2 souvenirs magiques");
}

function updateSpirits(dt) {
  for (let index = spirits.length - 1; index >= 0; index -= 1) {
    const spirit = spirits[index];
    const state = spirit.updateAI(spirits, shadows, flowers, obstacles, fairy, dt);
    spirit.integrate(width, height);
    if (state === "lost") {
      spirits.splice(index, 1);
      showToast("Un esprit s’est éteint · protégez les autres");
      if (spirits.length === 0 && flowers.some(flower => !flower.awake)) endGame(false);
    }
  }
}

function updateShadows(dt) {
  waveTimer += dt;
  const waveDuration = getWaveDuration();
  if (waveTimer >= waveDuration) {
    waveTimer -= waveDuration;
    waveNumber += 1;
    wavePending = Math.min(gardenSettings.shadowLimit, 1 + Math.floor(waveNumber / 2));
    const patchSpots = [[0.35, 0.48], [0.65, 0.65], [0.73, 0.31], [0.43, 0.78]];
    const point = levelPoint(...patchSpots[(waveNumber - 2) % patchSpots.length]);
    corruptionPatches.push(new CorruptionPatch(width * point.x, height * point.y, waveNumber, 36));
    if (corruptionPatches.length > 3) corruptionPatches.shift();
    applyDifficulty();
    gardenAudio.play("wave");
    showToast(`Vague ${waveNumber} · une zone de corruption apparaît`);
  }
  shadowSpawnTimer = Math.max(0, shadowSpawnTimer - dt);
  for (let index = shadows.length - 1; index >= 0; index -= 1) {
    const shadow = shadows[index];
    shadow.updateAI(spirits, fairy, obstacles, dt, gardenSettings.shadowPerception);
    shadow.integrate(width, height);
    if (shadow.health <= 0) {
      shadows.splice(index, 1);
      gardenAudio.play("banish");
      showToast("Une créature d’ombre a été dissipée");
    }
  }
  if (wavePending > 0 && shadows.length < gardenSettings.shadowLimit && shadowSpawnTimer <= 0) {
    shadows.push(createShadow(frameCount + shadows.length));
    wavePending -= 1;
    shadowSpawnTimer = 0.8;
  }
}

function getWaveDuration(interval = gardenSettings.waveInterval, mode = difficultyMode) {
  return interval * (mode === "calm" ? 1.35 : 1);
}

function updateFireflies() {
  for (const firefly of fireflies) {
    firefly.updateAI(fireflies, gardenCircuit, obstacles, flowers);
    firefly.integrate(width, height);
  }
}

function updateButterflies() {
  for (const butterfly of butterflies) {
    butterfly.updateAI(butterflies, flowers, obstacles);
    butterfly.integrate(width, height);
  }
}

function nearestByDistance(items, predicate = () => true) {
  return items
    .filter(predicate)
    .sort((a, b) => distanceToNearestFairy(a.pos) - distanceToNearestFairy(b.pos))[0] || null;
}

function nearestFairyTo(point) {
  return fairies.reduce((closest, agent) =>
    !closest || p5.Vector.dist(agent.pos, point) < p5.Vector.dist(closest.pos, point)
      ? agent : closest, null);
}

function distanceToNearestFairy(point) {
  const closest = nearestFairyTo(point);
  return closest ? p5.Vector.dist(closest.pos, point) : Infinity;
}

function currentObjective() {
  const flower = nearestByDistance(flowers, item => !item.awake);
  if (flower && fairy.crystalInventory > 0) return { kind: "flower", target: flower };
  if (crystalsFound < GOAL_CRYSTALS) {
    return {
      kind: "crystal",
      target: nearestByDistance(crystals, item => !item.collected) || nearestByDistance(crystals)
    };
  }
  if (flower) return { kind: "flower", target: flower };
  return { kind: "complete", target: null };
}

function updateGuidance() {
  if (!fairy) return;
  const objective = currentObjective();
  const heading = document.querySelector("#objective-title");
  const copy = document.querySelector("#objective-copy");
  const guide = document.querySelector("#objective-guide");
  const icon = document.querySelector("#nearby-icon");
  const label = document.querySelector("#nearby-label");
  const distanceOutput = document.querySelector("#nearby-distance");
  const arrow = document.querySelector("#objective-arrow");
  if (objective.kind === "crystal") {
    heading.textContent = "Récoltez les fragments";
    copy.textContent = "Les fleurs ont besoin de plusieurs fragments pour s’épanouir.";
    guide.textContent = `Fragments portés : ${fairy.crystalInventory} · Visez les cristaux qui brillent.`;
    icon.textContent = "✧";
    label.textContent = "Cristal le plus proche";
  } else if (objective.kind === "flower") {
    heading.textContent = "Nourrissez les fleurs";
    copy.textContent = "Offrez un fragment à chaque fleur jusqu’à remplir son cœur.";
    guide.textContent = `${objective.target.crystalsFed}/${objective.target.crystalsNeeded} fragments · ${fairy.crystalInventory} dans votre sac.`;
    icon.textContent = "✿";
    label.textContent = "Fleur à éveiller";
  } else if (objective.kind === "spirit") {
    heading.textContent = "Protégez les esprits";
    copy.textContent = "Approchez-vous d’un esprit libre et assurez-vous qu’aucune ombre ne le menace.";
    guide.textContent = "Une onde protectrice repousse les créatures proches.";
    icon.textContent = "◉";
    label.textContent = "Esprit à protéger";
  } else {
    heading.textContent = "Le jardin revit";
    copy.textContent = "Toutes les fleurs sont éveillées. Le jardin rayonne de nouveau.";
    guide.textContent = "Jardin restauré · la lumière revient.";
    icon.textContent = "✦";
    label.textContent = "Jardin restauré";
  }
  const guideFairy = objective.target ? nearestFairyTo(objective.target.pos) || fairy : fairy;
  const distance = objective.target ? p5.Vector.dist(guideFairy.pos, objective.target.pos) : 0;
  distanceOutput.textContent = objective.target ? `${Math.round(distance)} px` : "✓";
  if (objective.target && (objective.target.pos.x < 0 || objective.target.pos.x > width
      || objective.target.pos.y < 0 || objective.target.pos.y > height)) {
    const dx = objective.target.pos.x - guideFairy.pos.x;
    const dy = objective.target.pos.y - guideFairy.pos.y;
    const angle = Math.atan2(dy, dx);
    const edgeX = (width / 2 - 36) / Math.max(Math.abs(dx), 0.001);
    const edgeY = (height / 2 - 52) / Math.max(Math.abs(dy), 0.001);
    const distanceToEdge = Math.min(edgeX, edgeY);
    arrow.hidden = false;
    arrow.style.left = `${Math.max(34, Math.min(width - 34, guideFairy.pos.x + dx * distanceToEdge))}px`;
    arrow.style.top = `${Math.max(78, Math.min(height - 64, guideFairy.pos.y + dy * distanceToEdge))}px`;
    arrow.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  } else {
    arrow.hidden = true;
  }
}

function updateInteractionPrompt() {
  const prompt = document.querySelector("#interaction-prompt");
  const wardStatus = document.querySelector("#ward-status");
  if (!fairy) return;
  const flower = nearestByDistance(flowers, item => !item.awake && distanceToNearestFairy(item.pos) < 72);
  const spirit = nearestByDistance(spirits, item => !item.rescued && item.health > 0
    && distanceToNearestFairy(item.pos) < 70);
  const actions = [];
  if (flower) {
    actions.push(fairy.crystalInventory > 0
      ? `<kbd>E</kbd> Offrir un fragment · ${flower.crystalsFed}/${flower.crystalsNeeded}`
      : `Fragment requis · ${flower.crystalsFed}/${flower.crystalsNeeded}`);
  }
  if (spirit) {
    const threatened = shadows.some(shadow => p5.Vector.dist(shadow.pos, spirit.pos) < 85);
    actions.push(threatened ? "Éloignez l’ombre pour protéger" : "<kbd>F</kbd> Protéger l’esprit");
  }
  prompt.innerHTML = actions.join("　·　");
  prompt.hidden = actions.length === 0 || gamePaused || gameEnded;
  if (!prompt.hidden) {
    const promptFairy = nearestFairyTo((flower || spirit).pos) || fairy;
    prompt.style.left = `${Math.max(120, Math.min(width - 120, promptFairy.pos.x))}px`;
    prompt.style.top = `${Math.max(86, promptFairy.pos.y - 48)}px`;
  }
  wardStatus.hidden = fairy.wardTimer <= 0 || gamePaused;
  if (!wardStatus.hidden) wardStatus.textContent = `ONDE PROTECTRICE · ${fairy.wardTimer.toFixed(1)} s · rayon 145 px`;
}

function checkVictory() {
  if (flowers.length > 0 && flowers.every(flower => flower.awake)) endGame(true);
}

function endGame(won) {
  if (gameEnded) return;
  gameEnded = true;
  if (won) saveBestTime();
  document.querySelector("#end-title").textContent = won
    ? levelIndex < LEVELS.length - 1 ? "Le jardin rayonne" : "La magie renaît"
    : "La lueur s’est éteinte";
  document.querySelector("#end-copy").textContent = won
    ? levelIndex < LEVELS.length - 1
      ? `Toutes les fleurs sont éveillées · le jardin rayonne en ${formatTime(levelTime)}.`
      : `Toutes les fleurs des trois jardins brillent · la magie est revenue en ${formatTime(sessionTime)}.`
    : "Les ombres ont gagné du terrain. Le jardin a encore besoin de sa gardienne.";
  document.querySelector("#end-sparkle").textContent = won ? "✧" : "☾";
  document.querySelector("#next-level-button").hidden = !won || levelIndex >= LEVELS.length - 1;
  document.querySelector("#end-screen").hidden = false;
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  toastUntil = millis() + 2200;
}

function updateHud() {
  if (!fairy) return;
  const collected = Math.min(crystalsFound, GOAL_CRYSTALS);
  const bloomed = flowers.filter(flower => flower.awake).length;
  document.querySelector("#crystal-count").textContent = `${collected} / ${GOAL_CRYSTALS}`;
  document.querySelector("#flower-count").textContent = `${bloomed} / ${GOAL_FLOWERS}`;
  document.querySelector("#spirit-count").textContent = `${Math.min(rescuedTotal, GOAL_SPIRITS)} / ${GOAL_SPIRITS}`;
  document.querySelector("#energy-count").textContent = String(fairy.energy);
  document.querySelector("#living-count").textContent = String(spirits.length);
  document.querySelector("#generation-count").textContent = String(generation);
  document.querySelector("#reward-count").textContent = String(rewardTotal);
  document.querySelector("#wave-count").textContent = String(waveNumber);
  document.querySelector("#crystal-inventory").textContent = String(fairy.crystalInventory);
  document.querySelector("#energy-fill").style.width = `${100 * fairy.energy / fairy.maxEnergy}%`;
  const progress = Math.min(bloomed, GOAL_FLOWERS) / GOAL_FLOWERS;
  document.querySelector("#progress-fill").style.width = `${progress * 100}%`;
  const best = spirits.slice().sort((a, b) => b.fitness - a.fitness)[0];
  document.querySelector("#gene-note").textContent = best
    ? `peur ${best.dna.perception.toFixed(0)} · fuite ${best.dna.fleeWeight.toFixed(1)}`
    : "lignée des lucioles";
}

function updateClock() {
  document.querySelector("#world-clock").textContent = `JOUR ${String(levelIndex + 1).padStart(2, "0")} · ${formatTime(levelTime)}`;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for (const agent of fairies) {
    agent.pos.x = constrain(agent.pos.x, agent.radius, width - agent.radius);
    agent.pos.y = constrain(agent.pos.y, agent.radius, height - agent.radius);
    agent.destination.x = constrain(agent.destination.x, agent.radius, width - agent.radius);
    agent.destination.y = constrain(agent.destination.y, agent.radius, height - agent.radius);
  }
}
