let isAudioContextStarted = false;

class RunenteYTSequencer {
    constructor() {
        this.bpm = 120;
        this.isPlaying = false;
        this.currentStep = 0;
        this.nextStepTime = 0;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25.0;
        this.timerID = null;
        this.videoId = 'LKZ2omTPgBQ';

        // Tracks configuration
        this.tracks = [
            { timestamp: 10, mode: 'shot', volume: 100, isMuted: false, isSoloed: false, steps: new Array(16).fill(false) },
            { timestamp: 25, mode: 'shot', volume: 100, isMuted: false, isSoloed: false, steps: new Array(16).fill(false) },
            { timestamp: 45, mode: 'shot', volume: 100, isMuted: false, isSoloed: false, steps: new Array(16).fill(false) },
            { timestamp: 60, mode: 'shot', volume: 100, isMuted: false, isSoloed: false, steps: new Array(16).fill(false) },
            { timestamp: 80, mode: 'shot', volume: 100, isMuted: false, isSoloed: false, steps: new Array(16).fill(false) },
            { timestamp: 100, mode: 'shot', volume: 100, isMuted: false, isSoloed: false, steps: new Array(16).fill(false) },
            { timestamp: 120, mode: 'shot', volume: 100, isMuted: false, isSoloed: false, steps: new Array(16).fill(false) },
        ];

        this.players = [];
        this.audioCtx = null;

        // Preset System State
        this.presetMode = 'NONE'; // 'NONE', 'LOAD', 'SAVE'
        this.presets = new Array(8).fill(null);

        this.init();
        this.initPresets();
    }

    init() {
        this.initUI();
        this.bindGlobalEvents();
        this.bindPresetEvents();
    }

    initPresets() {
        // Load from LocalStorage
        const savedPresets = localStorage.getItem('runente_presets');
        if (savedPresets) {
            this.presets = JSON.parse(savedPresets);
        }

        // Factory Presets (If not already filled)
        if (!this.presets[0]) this.presets[0] = this.getHousePreset();
        if (!this.presets[1]) this.presets[1] = this.getJunglePreset();
        if (!this.presets[2]) this.presets[2] = this.getDubPreset();
        if (!this.presets[3]) this.presets[3] = this.getGlitchPreset();

        this.updatePresetUI();
    }

    bindPresetEvents() {
        const loadBtn = document.getElementById('preset-load');
        const saveBtn = document.getElementById('preset-save');
        const presetBtns = document.querySelectorAll('.preset-btn');

        loadBtn.addEventListener('click', () => {
            if (this.presetMode === 'LOAD') {
                this.presetMode = 'NONE';
            } else {
                this.presetMode = 'LOAD';
                this.presetModeNotify("Haz clic en un espacio para CARGAR");
            }
            this.updatePresetActionUI();
        });

        saveBtn.addEventListener('click', () => {
            if (this.presetMode === 'SAVE') {
                this.presetMode = 'NONE';
            } else {
                this.presetMode = 'SAVE';
                this.presetModeNotify("Haz clic en un espacio para GUARDAR");
            }
            this.updatePresetActionUI();
        });

        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                if (this.presetMode === 'LOAD') {
                    this.loadPreset(index);
                    this.presetMode = 'NONE';
                } else if (this.presetMode === 'SAVE') {
                    this.savePreset(index);
                    this.presetMode = 'NONE';
                }
                this.updatePresetActionUI();
            });
        });
    }

    presetModeNotify(msg) {
        // Simple visual feedback for mode
        console.log(`[Preset Mode]: ${msg}`);
    }

    updatePresetActionUI() {
        const loadBtn = document.getElementById('preset-load');
        const saveBtn = document.getElementById('preset-save');

        loadBtn.classList.toggle('active-load', this.presetMode === 'LOAD');
        saveBtn.classList.toggle('active-save', this.presetMode === 'SAVE');
    }

    updatePresetUI() {
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach((btn, i) => {
            btn.classList.toggle('filled', !!this.presets[i]);
        });
    }

    savePreset(index) {
        const presetData = {
            bpm: this.bpm,
            tracks: this.tracks.map(t => ({
                timestamp: t.timestamp,
                mode: t.mode,
                volume: t.volume,
                isMuted: t.isMuted,
                steps: [...t.steps]
            }))
        };
        this.presets[index] = presetData;
        localStorage.setItem('runente_presets', JSON.stringify(this.presets));
        this.updatePresetUI();
    }

    loadPreset(index) {
        const preset = this.presets[index];
        if (!preset) return;

        this.bpm = preset.bpm;
        document.getElementById('bpm').value = this.bpm;
        document.getElementById('bpm-value').textContent = this.bpm;

        preset.tracks.forEach((tData, i) => {
            if (this.tracks[i]) {
                const track = this.tracks[i];
                track.timestamp = tData.timestamp;
                track.mode = tData.mode;
                track.volume = tData.volume;
                track.isMuted = tData.isMuted || false;
                track.steps = [...tData.steps];
                this.updateTrackUI(i);
            }
        });

        // Sync audio state
        this.tracks.forEach((_, i) => this.updateTrackVolume(i));
    }

    updateTrackUI(index) {
        const track = this.tracks[index];
        const trackElements = document.querySelectorAll('.track');
        const trackEl = trackElements[index];
        if (!trackEl) return;

        // 1. Timestamp
        const tsInput = trackEl.querySelector('.timestamp-input');
        if (tsInput) tsInput.value = track.timestamp;

        // 2. Mode
        const modeBtn = trackEl.querySelectorAll('.square-btn')[1]; // Second square btn is mode
        if (modeBtn) {
            modeBtn.textContent = track.mode === 'shot' ? '1' : (track.mode === 'cont' ? '▶' : track.mode);
            modeBtn.classList.toggle('active', track.mode !== 'shot');
        }

        // 3. Volume
        const volSlider = trackEl.querySelector('.vol-slider');
        if (volSlider) volSlider.value = track.volume;

        // 4. Mute
        const muteBtn = trackEl.querySelector('.mixer-btn'); // First mixer-btn is mute
        if (muteBtn) muteBtn.classList.toggle('active', track.isMuted);

        // 5. Steps
        const stepElements = trackEl.querySelectorAll('.step');
        stepElements.forEach((el, i) => {
            if (track.steps[i]) el.classList.add('on');
            else el.classList.remove('on');
        });
    }

    getHousePreset() {
        return {
            bpm: 120,
            tracks: [
                { timestamp: 10, mode: 'shot', volume: 100, isMuted: false, steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
                { timestamp: 25, mode: 'shot', volume: 80, isMuted: false, steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
                { timestamp: 45, mode: 'shot', volume: 60, isMuted: false, steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
                { timestamp: 60, mode: 'shot', volume: 40, isMuted: false, steps: [false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false] },
                { timestamp: 80, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
                { timestamp: 100, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
                { timestamp: 120, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
            ]
        };
    }

    getJunglePreset() {
        return {
            bpm: 165,
            tracks: [
                { timestamp: 12, mode: 'shot', volume: 100, isMuted: false, steps: [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false] },
                { timestamp: 33, mode: 'shot', volume: 90, isMuted: false, steps: [false, false, false, true, false, false, true, false, false, true, false, false, true, true, false, false] },
                { timestamp: 5, mode: 'shot', volume: 70, isMuted: false, steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true] },
                { timestamp: 90, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
                { timestamp: 110, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
                { timestamp: 130, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
                { timestamp: 150, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
            ]
        };
    }

    getDubPreset() {
        return {
            bpm: 70,
            tracks: [
                { timestamp: 40, mode: 'shot', volume: 100, isMuted: false, steps: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false] },
                { timestamp: 15, mode: 'shot', volume: 80, isMuted: false, steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
                { timestamp: 120, mode: 'cont', volume: 50, isMuted: false, steps: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false] },
                { timestamp: 200, mode: 'shot', volume: 70, isMuted: false, steps: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true] },
                { timestamp: 80, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
                { timestamp: 100, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
                { timestamp: 120, mode: 'shot', volume: 100, isMuted: false, steps: new Array(16).fill(false) },
            ]
        };
    }

    getGlitchPreset() {
        const randomSteps = () => new Array(16).fill(0).map(() => Math.random() < 0.1);
        return {
            bpm: 135,
            tracks: [
                { timestamp: 1, mode: 'shot', volume: 100, isMuted: false, steps: randomSteps() },
                { timestamp: 7, mode: 'shot', volume: 90, isMuted: false, steps: randomSteps() },
                { timestamp: 14, mode: 'shot', volume: 80, isMuted: false, steps: randomSteps() },
                { timestamp: 22, mode: 'shot', volume: 70, isMuted: false, steps: randomSteps() },
                { timestamp: 40, mode: 'shot', volume: 100, isMuted: false, steps: randomSteps() },
                { timestamp: 60, mode: 'shot', volume: 100, isMuted: false, steps: randomSteps() },
                { timestamp: 80, mode: 'shot', volume: 100, isMuted: false, steps: randomSteps() },
            ]
        };
    }

    initUI() {
        const sequencerEl = document.getElementById('sequencer');
        sequencerEl.innerHTML = '';

        this.tracks.forEach((track, trackIndex) => {
            const trackEl = document.createElement('div');
            trackEl.className = 'track';

            // Mini Player Container
            const playerBox = document.createElement('div');
            playerBox.className = 'player-box';
            const playerDiv = document.createElement('div');
            playerDiv.id = `player-${trackIndex}`;
            playerDiv.className = 'mini-player';
            playerBox.appendChild(playerDiv);
            trackEl.appendChild(playerBox);

            // 1. Randomizer Time (Yellow Square)
            const tsInput = document.createElement('input');
            tsInput.className = 'timestamp-input';
            tsInput.type = 'number';
            tsInput.value = track.timestamp;
            tsInput.addEventListener('change', (e) => {
                track.timestamp = parseFloat(e.target.value);
            });
            trackEl.appendChild(tsInput);

            // 2. Timestamp Input
            const randTimeBtn = document.createElement('button');
            randTimeBtn.className = 'square-btn yellow';
            randTimeBtn.textContent = 'R';
            randTimeBtn.title = 'Aleatorizar tiempo de inicio';
            randTimeBtn.addEventListener('click', () => this.randomizeTrackTime(trackIndex));
            trackEl.appendChild(randTimeBtn);

            // 3. Mode Toggle (Square: 1, 2, 3, 4, ▶)
            const modeToggle = document.createElement('button');
            modeToggle.className = 'square-btn';
            modeToggle.textContent = track.mode === 'shot' ? '1' : (track.mode === 'cont' ? '▶' : track.mode);
            modeToggle.addEventListener('click', () => {
                const modes = ['shot', '2', '3', '4', 'cont'];
                let currentIndex = modes.indexOf(track.mode);
                let nextIndex = (currentIndex + 1) % modes.length;
                track.mode = modes[nextIndex];

                modeToggle.textContent = track.mode === 'shot' ? '1' : (track.mode === 'cont' ? '▶' : track.mode);
                modeToggle.classList.toggle('active', track.mode !== 'shot');
            });
            trackEl.appendChild(modeToggle);

            // 4. Randomizer Pattern (Yellow Square)
            const randPatternBtn = document.createElement('button');
            randPatternBtn.className = 'square-btn yellow';
            randPatternBtn.textContent = 'R';
            randPatternBtn.title = 'Aleatorizar patrón';
            randPatternBtn.addEventListener('click', () => this.randomizeTrackPattern(trackIndex));
            trackEl.appendChild(randPatternBtn);

            // Mixer Controls (Volume, Mute, Solo)
            const mixerEl = document.createElement('div');
            mixerEl.className = 'track-mixer';

            const volSlider = document.createElement('input');
            volSlider.className = 'vol-slider';
            volSlider.type = 'range';
            volSlider.min = 0;
            volSlider.max = 100;
            volSlider.value = track.volume;
            volSlider.addEventListener('input', (e) => {
                track.volume = parseInt(e.target.value);
                this.updateTrackVolume(trackIndex);
            });
            mixerEl.appendChild(volSlider);

            const muteBtn = document.createElement('button');
            muteBtn.className = 'square-btn mixer-btn';
            muteBtn.textContent = 'M';
            muteBtn.title = 'Silenciar';
            muteBtn.addEventListener('click', () => {
                track.isMuted = !track.isMuted;
                muteBtn.classList.toggle('active', track.isMuted);
                this.updateTrackVolume(trackIndex);
            });
            mixerEl.appendChild(muteBtn);

            const soloBtn = document.createElement('button');
            soloBtn.className = 'square-btn mixer-btn';
            soloBtn.textContent = 'S';
            soloBtn.title = 'Solo';
            soloBtn.addEventListener('click', () => {
                track.isSoloed = !track.isSoloed;
                soloBtn.classList.toggle('active', track.isSoloed);
                this.updateSoloStates();
            });
            mixerEl.appendChild(soloBtn);

            trackEl.appendChild(mixerEl);

            // Steps
            const stepsEl = document.createElement('div');
            stepsEl.className = 'steps';
            for (let i = 0; i < 16; i++) {
                const stepEl = document.createElement('div');
                stepEl.className = 'step';
                if (track.steps[i]) stepEl.classList.add('on');
                stepEl.dataset.track = trackIndex;
                stepEl.dataset.step = i;
                stepEl.addEventListener('click', () => this.toggleStep(trackIndex, i, stepEl));
                stepsEl.appendChild(stepEl);
            }
            trackEl.appendChild(stepsEl);

            sequencerEl.appendChild(trackEl);
        });
    }

    initPlayers() {
        this.players = [];
        this.tracks.forEach((_, i) => {
            const p = new YT.Player(`player-${i}`, {
                height: '75',
                width: '100',
                videoId: this.videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,
                    'mute': 1,
                    'origin': window.location.origin,
                    'enablejsapi': 1,
                    'rel': 0
                }
            });
            this.players.push(p);
        });
    }

    bindGlobalEvents() {
        document.getElementById('bpm').addEventListener('input', (e) => {
            this.bpm = parseInt(e.target.value);
            document.getElementById('bpm-value').textContent = this.bpm;
        });

        document.getElementById('load-video').addEventListener('click', () => {
            const url = document.getElementById('yt-url').value;
            const videoId = this.extractVideoId(url);
            if (videoId) {
                this.videoId = videoId;
                this.players.forEach(p => {
                    if (p && p.loadVideoById) p.loadVideoById(this.videoId);
                });
            }
        });

        document.getElementById('randomize-all').addEventListener('click', () => {
            this.tracks.forEach((_, i) => {
                this.randomizeTrackTime(i);
                this.randomizeTrackPattern(i);
            });
            if (!this.isPlaying) this.start();
        });

        document.getElementById('toggle-play').addEventListener('click', () => {
            this.togglePlayback();
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayback();
            }
        });
    }

    extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    toggleStep(trackIndex, stepIndex, stepEl) {
        this.tracks[trackIndex].steps[stepIndex] = !this.tracks[trackIndex].steps[stepIndex];
        stepEl.classList.toggle('on');
        if (!this.isPlaying) this.start();
    }

    randomizeTrackTime(trackIndex) {
        const track = this.tracks[trackIndex];
        const p = this.players[trackIndex];
        let duration = (p && typeof p.getDuration === 'function') ? p.getDuration() : 0;
        if (duration <= 0) duration = 180;

        track.timestamp = Math.floor(Math.random() * (duration - 5));
        if (track.timestamp < 0) track.timestamp = 0;

        this.updateTrackUI(trackIndex);
    }

    randomizeTrackPattern(trackIndex) {
        const track = this.tracks[trackIndex];
        track.steps = track.steps.map(() => Math.random() < 0.15);
        this.updateTrackUI(trackIndex);
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.isPlaying = true;
        this.currentStep = 0;
        this.nextStepTime = this.audioCtx.currentTime;
        document.getElementById('toggle-play').textContent = 'DETENER';
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
        document.getElementById('toggle-play').textContent = 'REPRODUCIR';
        this.players.forEach(p => {
            if (p && p.pauseVideo) p.pauseVideo();
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
        const delay = (time - this.audioCtx.currentTime) * 1000;

        setTimeout(() => {
            this.updateStepUI(step);
            this.tracks.forEach((track, i) => {
                if (track.steps[step]) {
                    this.triggerTrack(i);
                }
            });
        }, Math.max(0, delay));
    }

    updateStepUI(step) {
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
    }

    updateTrackVolume(index) {
        const track = this.tracks[index];
        const p = this.players[index];
        if (!p || typeof p.setVolume !== 'function') return;

        // Check if any track is soloed
        const anySolo = this.tracks.some(t => t.isSoloed);

        let effectiveVolume = track.volume;
        if (track.isMuted || (anySolo && !track.isSoloed)) {
            effectiveVolume = 0;
        }

        p.setVolume(effectiveVolume);
    }

    updateSoloStates() {
        this.tracks.forEach((_, i) => this.updateTrackVolume(i));
    }

    triggerTrack(index) {
        const track = this.tracks[index];
        const p = this.players[index];
        if (!p || typeof p.seekTo !== 'function') return;

        // Sync volume before play
        this.updateTrackVolume(index);

        p.seekTo(track.timestamp, true);
        p.unMute();
        p.playVideo();

        let durationMs = 0;
        if (track.mode === 'shot') {
            durationMs = 150;
        } else if (['2', '3', '4'].includes(track.mode)) {
            const steps = parseInt(track.mode);
            const secondsPerStep = 60.0 / this.bpm / 4;
            durationMs = steps * secondsPerStep * 1000;
        }

        if (durationMs > 0) {
            setTimeout(() => {
                if (p && p.pauseVideo) p.pauseVideo();
            }, durationMs);
        }
    }
}

// YT API callback
window.onYouTubeIframeAPIReady = () => {
    window.runenteSequencer = new RunenteYTSequencer();
    window.runenteSequencer.initPlayers();
};

// Global un-mute on interaction
document.addEventListener('mousedown', () => {
    if (window.runenteSequencer && window.runenteSequencer.audioCtx && window.runenteSequencer.audioCtx.state === 'suspended') {
        window.runenteSequencer.audioCtx.resume();
    }
}, { once: true });
