class NeonSequencer {
    constructor() {
        this.audioCtx = null;
        this.bpm = 120;
        this.isPlaying = false;
        this.currentStep = 0;
        this.nextStepTime = 0;
        this.lookahead = 25.0;
        this.scheduleAheadTime = 0.1;
        this.timerID = null;
        this.sampleBuffer = null;

        this.tracks = [
            { name: 'Kick', type: 'kick', steps: new Array(16).fill(false) },
            { name: 'Snare', type: 'snare', steps: new Array(16).fill(false) },
            { name: 'HiHat', type: 'hihat', steps: new Array(16).fill(false) },
            { name: 'Clap', type: 'clap', steps: new Array(16).fill(false) },
            { name: 'Cowbell', type: 'cowbell', steps: new Array(16).fill(false) },
            { name: 'Tom', type: 'tom', steps: new Array(16).fill(false) },
            { name: 'Sample', type: 'sample', steps: new Array(16).fill(false) }
        ];

        this.initUI();
    }

    initUI() {
        const sequencerEl = document.getElementById('sequencer');
        const bpmSlider = document.getElementById('bpm');
        const bpmValue = document.getElementById('bpm-value');
        const randomizeBtn = document.getElementById('randomize-btn');

        bpmSlider.addEventListener('input', (e) => {
            this.bpm = parseInt(e.target.value);
            bpmValue.textContent = this.bpm;
        });

        randomizeBtn.addEventListener('click', () => {
            this.randomize();
        });

        this.tracks.forEach((track, trackIndex) => {
            const trackEl = document.createElement('div');
            trackEl.className = `track track-${track.name.toLowerCase()}`;

            const label = document.createElement('div');
            label.className = 'track-label';
            label.textContent = track.name;
            trackEl.appendChild(label);

            const stepsEl = document.createElement('div');
            stepsEl.className = 'steps';

            for (let i = 0; i < 16; i++) {
                const stepEl = document.createElement('div');
                stepEl.className = 'step';
                stepEl.dataset.track = trackIndex;
                stepEl.dataset.step = i;

                stepEl.addEventListener('click', () => {
                    this.toggleStep(trackIndex, i, stepEl);
                });

                stepsEl.appendChild(stepEl);
            }

            trackEl.appendChild(stepsEl);
            sequencerEl.appendChild(trackEl);
        });
    }

    async initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadSample();
        }
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
    }

    async loadSample() {
        try {
            const response = await fetch('sample.wav');
            const arrayBuffer = await response.arrayBuffer();
            this.sampleBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            console.log('Sample loaded successfully');
        } catch (e) {
            console.error('Error loading sample.wav:', e);
        }
    }

    toggleStep(trackIndex, stepIndex, stepEl) {
        this.tracks[trackIndex].steps[stepIndex] = !this.tracks[trackIndex].steps[stepIndex];
        stepEl.classList.toggle('on');

        if (!this.isPlaying) {
            this.start();
        }
    }

    randomize() {
        this.tracks.forEach((track, trackIndex) => {
            track.steps = track.steps.map(() => {
                // Rhythmic probability based on instrument
                let prob = 0.05;
                if (track.type === 'hihat') prob = 0.3;
                if (track.type === 'kick') prob = 0.15;
                if (track.type === 'snare') prob = 0.1;
                return Math.random() < prob;
            });

            const steps = document.querySelectorAll(`.track-${track.name.toLowerCase()} .step`);
            steps.forEach((stepEl, i) => {
                if (track.steps[i]) {
                    stepEl.classList.add('on');
                } else {
                    stepEl.classList.remove('on');
                }
            });
        });

        if (!this.isPlaying) this.start();
    }

    start() {
        this.initAudio().then(() => {
            this.isPlaying = true;
            this.currentStep = 0;
            this.nextStepTime = this.audioCtx.currentTime;
            this.scheduler();
        });
    }

    scheduler() {
        while (this.nextStepTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextStepTime);
            this.advanceStep();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    advanceStep() {
        const secondsPerBeat = 60.0 / this.bpm / 4;
        this.nextStepTime += secondsPerBeat;
        this.currentStep = (this.currentStep + 1) % 16;
    }

    scheduleStep(step, time) {
        this.updateUI(step, time);

        this.tracks.forEach(track => {
            if (track.steps[step]) {
                this.playSound(track.type, time);
                if (track.type === 'kick') {
                    this.triggerKickPulse(time);
                }
            }
        });
    }

    triggerKickPulse(time) {
        const delay = (time - this.audioCtx.currentTime) * 1000;
        setTimeout(() => {
            document.body.style.setProperty('--kick-pulse', '1');
            setTimeout(() => {
                document.body.style.setProperty('--kick-pulse', '0');
            }, 100);
        }, Math.max(0, delay));
    }

    updateUI(step, time) {
        const delay = (time - this.audioCtx.currentTime) * 1000;
        setTimeout(() => {
            const allSteps = document.querySelectorAll('.step');
            allSteps.forEach(s => s.classList.remove('current'));

            const currentSteps = document.querySelectorAll(`.step[data-step="${step}"]`);
            currentSteps.forEach(s => {
                s.classList.add('current');
                if (s.classList.contains('on')) {
                    s.classList.remove('active');
                    void s.offsetWidth;
                    s.classList.add('active');
                }
            });
        }, Math.max(0, delay));
    }

    playSound(type, time) {
        switch (type) {
            case 'kick': this.createKick(time); break;
            case 'snare': this.createSnare(time); break;
            case 'hihat': this.createHiHat(time); break;
            case 'clap': this.createClap(time); break;
            case 'cowbell': this.createCowbell(time); break;
            case 'tom': this.createTom(time); break;
            case 'sample': this.createSample(time); break;
        }
    }

    createKick(time) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    createSnare(time) {
        const noisePath = this.audioCtx.createBufferSource();
        noisePath.buffer = this.whiteNoiseBuffer();
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        noisePath.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, time);
        osc.connect(oscGain);
        oscGain.gain.setValueAtTime(0.7, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        oscGain.connect(this.audioCtx.destination);

        noisePath.start(time);
        noisePath.stop(time + 0.2);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    createHiHat(time) {
        const osc = this.audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 10000;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
    }

    createClap(time) {
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = this.whiteNoiseBuffer();
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        noise.start(time);
        noise.stop(time + 0.3);
    }

    createCowbell(time) {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(800, time);
        osc2.frequency.setValueAtTime(540, time);
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.2);
        osc2.stop(time + 0.2);
    }

    createTom(time) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.2);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    createSample(time) {
        if (this.sampleBuffer) {
            const source = this.audioCtx.createBufferSource();
            source.buffer = this.sampleBuffer;
            source.connect(this.audioCtx.destination);
            source.start(time);
        }
    }

    whiteNoiseBuffer() {
        if (this._noiseBuffer) return this._noiseBuffer;
        const bufferSize = this.audioCtx.sampleRate * 2;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        this._noiseBuffer = buffer;
        return buffer;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new NeonSequencer();
});
