const test = require("node:test");
const assert = require("node:assert/strict");

const scheduled = new Map();
let nextScheduleId = 1;
const audioParameters = [];
const oscillators = [];

class FakeAudioParam {
  constructor() {
    this.value = 0;
    this.events = [];
    audioParameters.push(this);
  }

  setValueAtTime(value, time) { this.value = value; this.events.push(["set", value, time]); }
  setTargetAtTime(value, time, constant) { this.value = value; this.events.push(["target", value, time, constant]); }
  exponentialRampToValueAtTime(value, time) { this.value = value; this.events.push(["ramp", value, time]); }
}

class FakeNode {
  constructor() {
    this.gain = new FakeAudioParam();
    this.frequency = new FakeAudioParam();
    this.connections = [];
    this.disconnected = false;
  }

  connect(destination) { this.connections.push(destination); }
  disconnect() { this.disconnected = true; }
  start() {}
  stop() {}
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 10;
    this.state = "running";
    this.destination = new FakeNode();
    FakeAudioContext.instances.push(this);
  }

  createGain() { return new FakeNode(); }
  createOscillator() {
    const oscillator = new FakeNode();
    oscillators.push(oscillator);
    return oscillator;
  }
  resume() { return Promise.resolve(); }
}
FakeAudioContext.instances = [];

global.window = { AudioContext: FakeAudioContext };
const GardenAudio = require("../audio.js");

test("music starts only after the user enables sound and stop clears its loop", () => {
  const audio = new GardenAudio({
    schedule(callback, delay) {
      const id = nextScheduleId++;
      scheduled.set(id, { callback, delay });
      return id;
    },
    cancelSchedule(id) { scheduled.delete(id); }
  });

  assert.equal(audio.context, null);
  assert.equal(audio.toggle(), true);
  assert.equal(FakeAudioContext.instances.length, 1);
  assert.equal(scheduled.size, 1);
  assert.equal(scheduled.values().next().value.delay, 900);
  assert.equal(oscillators.length, 5);
  assert.deepEqual(
    oscillators.slice(-5).map(oscillator => oscillator.frequency.value),
    [130.81, 164.81, 196, 523.25, 1046.5]
  );
  assert.ok(audio.musicGain.connections.includes(audio.context.destination));

  const musicTimer = audio.musicTimer;
  scheduled.get(musicTimer).callback();
  assert.equal(oscillators.length, 7);
  assert.equal(audio.musicStep, 2);
  oscillators[0].onended();
  assert.equal(oscillators[0].disconnected, true);

  assert.equal(audio.toggle(), false);
  assert.equal(scheduled.size, 0);
  assert.equal(audio.musicTimer, null);
  assert.equal(audio.musicGain.gain.value, 0);
});

test("music volume updates its gain and clamps invalid endpoints", () => {
  const audio = new GardenAudio({ schedule: () => 1, cancelSchedule: () => {} });
  audio.toggle();
  audio.setMusicVolume(0.6);
  assert.equal(audio.musicGain.gain.value, 0.072);
  audio.setMusicVolume(5);
  assert.equal(audio.musicVolume, 1);
  assert.equal(audio.musicGain.gain.value, 0.12);
  audio.setMusicVolume(-2);
  assert.equal(audio.musicVolume, 0);
  assert.equal(audio.musicGain.gain.value, 0);
  audio.toggle();
});

test("sound effects remain disabled until sound is enabled", () => {
  const audio = new GardenAudio({ schedule: () => 1, cancelSchedule: () => {} });
  const countBefore = oscillators.length;
  audio.play("crystal");
  assert.equal(oscillators.length, countBefore);
  audio.toggle();
  audio.play("crystal");
  assert.equal(oscillators.length, countBefore + 7);
  audio.toggle();
});
