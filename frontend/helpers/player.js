export class Player {
    // delay in ms
    constructor(masterInfo, sourceName, fftSize, onEnd) {
        this.masterInfo = masterInfo;
        this.song1 = new Audio();
        this.song2 = new Audio();

        this.playing1 = false;
        this.playing2 = false;
        this.arrayPlay = false;

        // this.song1.oncanplaythrough = () => {};

        this.timeStarted = false;
        this.song2Timeout = false;
        this.delay = masterInfo.songDelay;
        // this.delay = 0;
        this.timeToStart2 = this.delay;

        this.song1.addEventListener("ended", () => {
            this.playing1 = false;
        });
        this.song2.addEventListener("ended", () => {
            this.playing2 = false;
            this.timeToStart2 = this.delay;
            this.restart();
            onEnd();
        });
        
        this.waiting = false;
        this.countdownCanceled = false;

        const detailedAudioCtx = new AudioContext();

        const detailedAudioSource = detailedAudioCtx.createMediaElementSource(this.song1);
        this.detailedAnalyser = detailedAudioCtx.createAnalyser();
        detailedAudioSource.connect(this.detailedAnalyser);
        detailedAudioCtx.setSinkId({ type: "none" });
        this.detailedAnalyser.connect(detailedAudioCtx.destination);
        // this.detailedAnalyser.smoothingTimeConstant = 0;
        this.detailedAnalyser.fftSize = 4096;
        this.detailedDataArray = new Uint8Array(this.detailedAnalyser.frequencyBinCount);

        // mp3 experiment
        // const detailedAudioSource = detailedAudioCtx.createMediaElementSource(this.song1);
        // const dest = detailedAudioCtx.createMediaStreamDestination();
        // this.detailedAnalyser = detailedAudioCtx.createAnalyser();
        // detailedAudioSource.connect(this.detailedAnalyser);
        // detailedAudioCtx.setSinkId({ type: "none" });
        // this.detailedAnalyser.connect(detailedAudioCtx.destination);
        // // this.detailedAnalyser.smoothingTimeConstant = 0;
        // this.detailedAnalyser.fftSize = 4096;
        // this.detailedDataArray = new Uint8Array(this.detailedAnalyser.frequencyBinCount);
        // end experiment

        // For delayed frequency array requests
        this.freqArrays = [];
        this.times = [];
    }

    setPlayerReady(callback) {
        this.song1.oncanplaythrough = callback;
    }

    countdown() {
        const rockLabel = document.getElementById("rock-label");
        rockLabel.classList.add("countdown-label");
        rockLabel.innerText = "Ready";
        this.countdownCanceled = false;
        setTimeout(() => {
            if (!this.countdownCanceled) {
                rockLabel.innerText = "3";
            } else {
                rockLabel.classList.remove("countdown-label");
            }
        }, 1000);
        setTimeout(() => {
            if (!this.countdownCanceled) {
                rockLabel.innerText = "2";
            } else {
                rockLabel.classList.remove("countdown-label");
            }
        }, 2000);
        setTimeout(() => {
            if (!this.countdownCanceled) {
                rockLabel.innerText = "1";
            } else {
                rockLabel.classList.remove("countdown-label");
            }
        }, 3000);
        setTimeout(() => {
            if (!this.countdownCanceled) {
                rockLabel.innerText = "";
            }
            rockLabel.classList.remove("countdown-label");
        }, 4000);
    }

    start() {
        if (this.masterInfo.songAtStart) {
            this.countdown();
        }
        this.masterInfo.songAtStart = false;
        if (this.arrayPlay) {
            this.songPiece.audio.play();
        } else {
            this.song1.play();
        }
        this.playing1 = true;
        this.timeStarted = performance.now();
        if (this.timeToStart2) {
            this.song2Timeout = setTimeout(() => {
                this.song2.play();
                this.playing2 = true;
                this.timeToStart2 = false;
                this.waiting = false;
            }, this.timeToStart2);
            this.waiting = true;
        } else {
            this.song2.play();
            this.playing2 = true;
        }

    }

    pause() {
        if (this.playing2) {
            this.song2.pause();
            this.playing2 = false;
            if (this.arrayPlay) {
                this.songPiece.audio.pause();
            } else {
                this.song1.pause();  // no harm if it's already ended
            }
            this.playing1 = false;
        } else {
            if (this.song1.playing) {
                if (this.arrayPlay) {
                    this.songPiece.audio.pause();
                } else {
                    this.song1.pause();
                }
                this.song1.playing = false;
                clearTimeout(this.song2Timeout);
                this.timeToStart2 = performance.now() - timeStarted;
            }
        }
        this.countdownCanceled = true;
    }

    restart() {
        if (this.arrayPlay) {
            this.songPiece.audio.pause();
            this.arrayPos = 0;
            this.songPiece = this.piecesArray[this.arrayPos];
            this.song2.pause();
            this.playing1 = false;
            this.playing2 = false;
            if (this.waiting) {
                clearTimeout(this.song2Timeout);
                this.waiting = false;
            }
            this.timeToStart2 = this.delay;
            this.song2.currentTime = 0;
            this.masterInfo.songAtStart = true;
            this.countdownCanceled = true;
        } else {
            this.song1.pause();
            this.song2.pause();
            this.playing1 = false;
            this.playing2 = false;
            if (this.waiting) {
                clearTimeout(this.song2Timeout);
                this.waiting = false;
            }
            this.timeToStart2 = this.delay;
            this.song1.currentTime = 0;
            this.song2.currentTime = 0;
            this.masterInfo.songAtStart = true;
            this.countdownCanceled = true;
        }
    }

    setSource(songData, arrayPlay = false, arrayData = false) {
        if (arrayPlay) {
            if (arrayData) {
                this.arrayPlay = true;
                this.arrayPos = 0; // current piece in the array

                let arrLength = 0;
                arrayData.forEach((piece) => {
                    if (piece.startTime !== null) {
                        arrLength += 1;
                    }
                });

                this.piecesArray = arrayData.slice(0, arrLength);
                this.songPiece = this.piecesArray[this.arrayPos];
                this.piecesArray.forEach((pieceObj) => {
                    pieceObj.audio.addEventListener("ended", () => {
                        this.startNextPiece();
                    });
                });
                this.song2.setAttribute("src", songData);
                if (arrayData.length > 0) {
                    this.restart();
                    this.masterInfo.songAtStart = true;
                }
            } else {
                if (this.piecesArray) {
                    this.piecesArray.forEach((piece) => {
                        if (piece.ctx) {
                            piece.ctx.close();
                        }
                    });
                }
                this.piecesArray = null;
                this.songPiece = null;
            }
        } else {
            this.arrayPlay = false;
            this.restart();
            this.song1.setAttribute("src", songData);
            this.song2.setAttribute("src", songData);
            this.masterInfo.songAtStart = true;
        }
    }

    startNextPiece() {
        this.arrayPos += 1;
        if (this.piecesArray[this.arrayPos]) {
            this.songPiece = this.piecesArray[this.arrayPos];
            this.songPiece.audio.play();
        } else {
            // Do we have to do anything here?
        }
    }

    // for DETAILED EXPERIMENT
    getDetailedFreqArray() {
        if (this.arrayPlay) {
            // this.songPiece.analyser.smoothingTimeConstant = 0.85;
            this.songPiece.analyser.smoothingTimeConstant = 0.0;
            this.songPiece.analyser.getByteFrequencyData(this.songPiece.array);
            return this.songPiece.array.map(ele => ele);
        } else {
            // this.detailedAnalyser.smoothingTimeConstant = 0.85;
            this.detailedAnalyser.smoothingTimeConstant = 0.0;
            this.detailedAnalyser.getByteFrequencyData(this.detailedDataArray);
            return this.detailedDataArray.map(ele => ele);
        }
    }
    getDetailedTimeArray() {
        if (this.arrayPlay) {
            this.songPiece.analyser.smoothingTimeConstant = 0.0;
            this.songPiece.analyser.getByteTimeDomainData(this.songPiece.array);
            return this.songPiece.array.map(ele => ele);
        } else {
            this.detailedAnalyser.smoothingTimeConstant = 0.0;
            this.detailedAnalyser.getByteTimeDomainData(this.detailedDataArray);
            return this.detailedDataArray.map(ele => ele);
        }
    }
    // END DETAILED EXPERIMENT

    getDataFreqArray() {
        this.analyser.getByteFrequencyData(this.dataArray);

        this.freqArrays.push(this.dataArray.map(val => val));
        const now = performance.now();
        this.times.push(now);
        while (this.times[0] < now - this.delay) {
            this.times.shift();
            this.freqArrays.shift();
        }

        return this.dataArray;
    }

    getDataFreqArrayDelayed(delay = 2000) {

        let i = 0;
        while (performance.now() - delay > this.times[i]){
            i += 1;
            if (!this.times[i]) {
                break;
            }
        }
        if (this.times[i]) {
            return this.freqArrays[i];
        } else {
            return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        }
    }

    setVolume(val) {
        this.song2.volume = val;
    }

    calibrateLag(delay = this.delay) {
        const delayInSeconds = 1.0 * delay / 1000;
        if (this.arrayPlay) {
            if (this.playing2 && this.songPiece.audio.currentTime < 0.5 * this.songPiece.audio.duration) {
                this.songPiece.audio.currentTime = this.song2.currentTime + delayInSeconds - this.songPiece.startTime;
            }
        } else {
            if (this.song1.currentTime > delayInSeconds) {  // just check to make sure we're playing song2 yet
                this.song1.currentTime = this.song2.currentTime + delayInSeconds;
            }
        }
    }
}