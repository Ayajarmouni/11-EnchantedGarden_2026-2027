const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const folder = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(folder, "index.html"), "utf8");
const sketch = fs.readFileSync(path.join(folder, "sketch.js"), "utf8");

function createGardenContext() {
  const nodes = new Map();
  const values = new Map();
  const document = {
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, { textContent: "", style: {}, value: "" });
      return nodes.get(selector);
    }
  };
  class Flower {
    constructor(x, y, tint, index) { this.pos = { x, y }; this.tint = tint; this.index = index; }
  }
  class Crystal {
    constructor(x, y, hue) { this.pos = { x, y }; this.hue = hue; }
  }
  class Fairy {
    constructor(x, y) {
      this.pos = { x, y };
      this.destination = { x, y };
      this.radius = 12;
    }
    setDestination(point) {
      this.destination = point.copy ? point.copy() : { x: point.x, y: point.y };
    }
  }
  const context = vm.createContext({
    document,
    localStorage: {
      getItem: key => values.get(key) || null,
      setItem: (key, value) => values.set(key, value)
    },
    GardenFlower: Flower,
    MagicCrystal: Crystal,
    GardenFairy: Fairy,
    TWO_PI: Math.PI * 2,
    width: 1000,
    height: 800,
    createVector: (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } }),
    color: value => value,
    console
  });
  vm.runInContext(sketch, context);
  context.savedValues = values;
  return context;
}

test("flower slider range is 1–5 and shadow slider range is 1–6", () => {
  assert.match(html, /Nombre de fleurs[\s\S]*?id="garden-count" type="range" min="1" max="5" step="1" value="4"/);
  assert.match(html, /id="shadow-limit" type="range" min="1" max="6" step="1" value="3"/);
});

test("fairy count slider supports one to six fairies", () => {
  assert.match(html, /id="fairy-count" type="range" min="1" max="6" step="1" value="1"/);
  assert.match(html, /for="fairy-count">[\s\S]*?Nombre de fées/);
});

test("new behavior sliders expose their supported ranges", () => {
  assert.match(html, /id="shadow-perception" type="range" min="60" max="220" step="5" value="150"/);
  assert.match(html, /id="firefly-cohesion" type="range" min="0" max="2" step="0\.01" value="0\.42"/);
  assert.match(html, /id="wave-interval" type="range" min="15" max="60" step="1" value="30"/);
});

test("music volume slider exposes an independent percentage range", () => {
  assert.match(html, /id="music-volume" type="range" min="0" max="1" step="0\.01" value="0\.35"/);
  assert.match(html, /for="music-volume"/);
});

test("difficulty and simulation-speed controls are present", () => {
  assert.match(html, /id="difficulty"/);
  assert.match(html, /value="calm"/);
  assert.match(html, /value="adventure"/);
  assert.match(html, /id="time-scale"/);
  assert.match(html, /value="0\.5"/);
  assert.match(html, /value="1\.5"/);
});

test("fairy movement uses click and touch destinations instead of keyboard steering", () => {
  assert.match(html, /CLIC \/ TOUCHER POUR VOYAGER/);
  assert.doesNotMatch(html, /DÉPLACER<\/span>|<kbd>W<\/kbd><kbd>A<\/kbd><kbd>S<\/kbd><kbd>D<\/kbd>/);
  assert.match(sketch, /function touchStarted\(event\)/);
  assert.match(sketch, /setFairyDestinationFromPointer\(touches\[0\]\.x, touches\[0\]\.y\)/);
  assert.match(sketch, /function drawFairyDestination\(\)/);
  assert.doesNotMatch(sketch, /event\.key\.toLowerCase\(\) === "[wasd]"|event\.key === "Arrow(?:Up|Down|Left|Right)"/);
});

test("all configured fairies follow the same destination and count stays between one and six", () => {
  const context = createGardenContext();
  vm.runInContext("fairy = new GardenFairy(100, 100); fairies = [fairy]; fairy.setDestination(createVector(150, 150))", context);
  vm.runInContext("setFairyCount(6)", context);
  assert.deepEqual(
    Array.from(vm.runInContext("[fairies.length, gardenSettings.fairyCount, fairies.every(agent => agent.destination.x === 150 && agent.destination.y === 150)]", context)),
    [6, 6, true]
  );
  vm.runInContext("setFairyCount(0)", context);
  assert.deepEqual(
    Array.from(vm.runInContext("[fairies.length, gardenSettings.fairyCount]", context)),
    [1, 1]
  );
});

test("all flowers blooming wins the garden without requiring spirit rescues", () => {
  const context = createGardenContext();
  vm.runInContext("lastOutcome = null; endGame = won => { lastOutcome = won; gameEnded = true; }; flowers = [{ awake: true }, { awake: false }]; gameEnded = false; checkVictory()", context);
  assert.equal(vm.runInContext("gameEnded", context), false);
  vm.runInContext("flowers[1].awake = true; checkVictory()", context);
  assert.equal(vm.runInContext("lastOutcome", context), true);
  assert.equal(vm.runInContext("gameEnded", context), true);
});

test("every DOM id used by the scene exists in the game page", () => {
  const requiredIds = [...sketch.matchAll(/querySelector\("#([^"]+)"\)/g)]
    .map((match) => match[1]);
  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id="${id}"`), `Missing DOM element #${id}`);
  }
});

test("the steering base and helper classes load before their subclasses and scene", () => {
  const baseIndex = html.indexOf('src="vehicle.js"');
  const debugIndex = html.indexOf('src="debug-vehicle.js"');
  const fairyIndex = html.indexOf('src="fairy.js"');
  const sceneIndex = html.indexOf('src="sketch.js"');
  assert.ok(baseIndex >= 0 && baseIndex < debugIndex);
  assert.ok(debugIndex < fairyIndex && fairyIndex < sceneIndex);
  assert.match(html, /src="corruption\.js"/);
});

test("all garden levels use a light magical palette", () => {
  const context = createGardenContext();
  const palettes = Array.from(vm.runInContext("LEVELS.map(level => level.background)", context), level =>
    Array.from(level));
  assert.equal(palettes.length, 3);
  for (const palette of palettes) {
    assert.equal(palette.length, 3);
    for (const color of palette) {
      const channels = color.slice(1).match(/../g).map(channel => parseInt(channel, 16));
      assert.ok(channels.reduce((sum, channel) => sum + channel, 0) / 3 >= 180, `${color} should be light`);
    }
  }
});

test("changing the flower count keeps both populations synchronized and totals their shard costs", () => {
  const context = createGardenContext();
  vm.runInContext("fairy = { energy: 3, maxEnergy: 5 };", context);

  vm.runInContext("setGardenCount(1)", context);
  assert.deepEqual(
    Array.from(vm.runInContext("[flowers.length, crystals.length, GOAL_FLOWERS, GOAL_CRYSTALS]", context)),
    [1, 1, 1, 2]
  );

  vm.runInContext("setGardenCount(5)", context);
  assert.deepEqual(
    Array.from(vm.runInContext("[flowers.length, crystals.length, GOAL_FLOWERS, GOAL_CRYSTALS]", context)),
    [5, 5, 5, 12]
  );
});

test("each of the three gardens has its own layout and crystal goal totals include flower costs", () => {
  const context = createGardenContext();
  assert.deepEqual(
    Array.from(vm.runInContext("[LEVELS.length, crystalGoalFor(1), crystalGoalFor(4), crystalGoalFor(5)]", context)),
    [3, 2, 10, 12]
  );
  assert.deepEqual(
    Array.from(vm.runInContext("levelIndex = 1; const point = levelPoint(0.2, 0.3); [point.x, point.y]", context)),
    [0.8, 0.7]
  );
});

test("lowering the shadow limit immediately removes excess shadows", () => {
  const context = createGardenContext();
  vm.runInContext("shadows = [{}, {}, {}, {}]", context);
  vm.runInContext("setShadowLimit(2)", context);
  assert.deepEqual(
    Array.from(vm.runInContext("[shadows.length, gardenSettings.shadowLimit, shadowSpawnTimer]", context)),
    [2, 2, 0]
  );
});

test("saved preferences are clamped to the available setting ranges", () => {
  const context = createGardenContext();
  context.savedValues.set("enchantedGarden.preferences.v1", JSON.stringify({
    fairySpeed: 99,
    fairyForce: 0.12,
    fairyCount: 10,
    spiritSpeed: 2.5,
    shadowSpeed: -1,
    shadowPerception: 500,
    fireflyCohesion: -1,
    waveInterval: 14.5,
    collectibleCount: 3.7,
    shadowLimit: 8,
    difficulty: "calm",
    timeScale: 0.5
  }));
  vm.runInContext("loadGardenPreferences()", context);
  assert.deepEqual(
    Array.from(vm.runInContext("[gardenSettings.fairySpeed, gardenSettings.fairyForce, gardenSettings.fairyCount, gardenSettings.spiritSpeed, gardenSettings.shadowSpeed, gardenSettings.shadowPerception, gardenSettings.fireflyCohesion, gardenSettings.waveInterval, gardenSettings.collectibleCount, gardenSettings.shadowLimit, difficultyMode, simulationScale]", context)),
    [8, 0.12, 6, 2.5, 0.5, 220, 0, 15, 4, 6, "calm", 0.5]
  );
});

test("updated preferences are written to browser storage", () => {
  const context = createGardenContext();
  vm.runInContext("gardenSettings.fairySpeed = 5.5; gardenSettings.fairyCount = 4; gardenSettings.musicVolume = 0.68; gardenSettings.shadowPerception = 205; gardenSettings.fireflyCohesion = 1.15; gardenSettings.waveInterval = 45; difficultyMode = 'calm'; simulationScale = 0.5; saveGardenPreferences()", context);
  const saved = JSON.parse(context.savedValues.get("enchantedGarden.preferences.v1"));
  assert.equal(saved.fairySpeed, 5.5);
  assert.equal(saved.fairyCount, 4);
  assert.equal(saved.musicVolume, 0.68);
  assert.equal(saved.shadowPerception, 205);
  assert.equal(saved.fireflyCohesion, 1.15);
  assert.equal(saved.waveInterval, 45);
  assert.equal(saved.difficulty, "calm");
  assert.equal(saved.timeScale, 0.5);
});

test("stored music volume is clamped to its supported range", () => {
  const context = createGardenContext();
  context.savedValues.set("enchantedGarden.preferences.v1", JSON.stringify({ musicVolume: 1.8 }));
  vm.runInContext("loadGardenPreferences()", context);
  assert.equal(vm.runInContext("gardenSettings.musicVolume", context), 1);
});

test("wave interval uses the selected slider value and preserves calm-mode spacing", () => {
  const context = createGardenContext();
  assert.deepEqual(
    Array.from(vm.runInContext("[getWaveDuration(40, 'adventure'), getWaveDuration(40, 'calm')]", context)),
    [40, 54]
  );
});
