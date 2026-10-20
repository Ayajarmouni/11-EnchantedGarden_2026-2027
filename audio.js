class GardenAudio {
  constructor({ schedule = setInterval, cancelSchedule = clearInterval } = {}) {
    this.context = null;
    this.enabled = false;
    this.musicVolume = 0.35;
    this.musicGain = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.schedule = schedule;
    this.cancelSchedule = cancelSchedule;
    this.melody = [
      523.25, 659.25, 783.99, 987.77,
      783.99, 659.25, 587.33, 783.99,
      880, 783.99, 659.25, 523.25,
      587.33, 659.25, 523.25, 392
    ];
    this.ambientChords = [
      [130.81, 164.81, 196],
      [110, 130.81, 164.81],
      [87.31, 110, 130.81],
      [98, 123.47, 146.83]
    ];
  }

  toggle() {
    const nextEnabled = !this.enabled;
    if (nextEnabled && !this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return false;
      }
      this.context = new AudioContextClass();
    }
    this.enabled = nextEnabled;
    if (this.context && this.context.state === "suspended") {
      const resumed = this.context.resume();
      if (resumed?.catch) {
        resumed.catch(error => console.warn("Impossible d’activer le son du jardin.", error));
      }
    }
    if (this.enabled) this.startMusic();
    else this.stopMusic();
    return this.enabled;
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.musicGain && this.context) {
      this.musicGain.gain.setTargetAtTime(
        this.musicVolume * 0.12,
        this.context.currentTime,
        0.04
      );
    }
  }

  startMusic() {
    if (!this.enabled || !this.context || this.musicTimer !== null) return;
    if (!this.musicGain) {
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.context.destination);
    }
    this.musicGain.gain.setTargetAtTime(
      this.musicVolume * 0.12,
      this.context.currentTime,
      0.8
    );
    this.playMusicNote();
    this.musicTimer = this.schedule(() => this.playMusicNote(), 900);
  }

  playMusicNote() {
    if (!this.enabled || !this.context || !this.musicGain) return;
    const start = this.context.currentTime + 0.02;
    const step = this.musicStep;
    const frequency = this.melody[step % this.melody.length];
    if (step % 8 === 0) {
      this.playAmbientChord(Math.floor(step / 8) % this.ambientChords.length, start);
    }
    this.musicStep += 1;
    for (const [pitch, volume] of [[frequency, 0.19], [frequency * 2, 0.045]]) {
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(pitch, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(volume, start + 0.12);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 1.8);
      oscillator.connect(envelope);
      envelope.connect(this.musicGain);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + 1.85);
    }
  }

  playAmbientChord(chordIndex, start) {
    for (const frequency of this.ambientChords[chordIndex]) {
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(0.018, start + 1.4);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 6.9);
      oscillator.connect(envelope);
      envelope.connect(this.musicGain);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + 7);
    }
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      this.cancelSchedule(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGain && this.context) {
      this.musicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.04);
    }
  }

  play(kind) {
    if (!this.enabled || !this.context) return;
    const notes = {
      crystal: [784, 1047], bloom: [523, 784, 988],
      ward: [330, 440, 660], rescue: [659, 880], banish: [392, 262],
      reward: [659, 784, 988, 1175], wave: [196, 294, 392]
    }[kind] || [440];
    const start = this.context.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start + index * 0.07);
      gain.gain.setValueAtTime(0.0001, start + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.09, start + index * 0.07 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.07 + 0.42);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(start + index * 0.07);
      oscillator.stop(start + index * 0.07 + 0.44);
    });
  }
}

if (typeof module !== "undefined" && module.exports) module.exports = GardenAudio;
