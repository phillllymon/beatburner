import {
    setLoadingMessage,
    setLoadingPercent
} from "./util.js";

export class FileConverter {
    constructor() {
        this.barPos = 0;

        // reuse experiment
        // this.player = new Audio();
        // this.piecePlayers = [];
        // this.recorders = [];
        // this.pieces = [];
        // this.streams = [];
        // this.contexts = [];
        // for (let i = 0; i < 30; i++) {
        //     const piecePlayer = new Audio();
        //     const pieceCtx = new AudioContext();
        //     const dest = pieceCtx.createMediaStreamDestination();
        //     const recorder = new MediaRecorder(dest.stream);
        //     // const stream = pieceCtx.createMediaElementSource(piecePlayer);
        //     // stream.connect(dest);
        //     this.piecePlayers.push(piecePlayer);
        //     this.contexts.push(pieceCtx);
        //     this.recorders.push(recorder);
        //     // this.streams.push(stream);

        //     const pieceAudio = new Audio();
        //     const newCtx = new AudioContext();
        //     const newSource = newCtx.createMediaElementSource(pieceAudio);
        //     const newAnalyser = newCtx.createAnalyser();
        //     newSource.connect(newAnalyser);
        //     newCtx.setSinkId({ type: "none" });
        //     newAnalyser.connect(newCtx.destination);
        //     newAnalyser.fftSize = 4096;
        //     const newArray = new Uint8Array(newAnalyser.frequencyBinCount);
        //     this.pieces.push({
        //         audio: pieceAudio,
        //         startTime: null,
        //         analyser: newAnalyser,
        //         array: newArray
        //     });
        // }
    }

    startBarAnimate(endPos, time) {
        const distToGo = endPos - this.barPos;
        const endTime = performance.now() + time;
        const numSteps = time / 500;
        const distPerStep = distToGo / Math.ceil(numSteps);
        const animateInterval = setInterval(() => {
            setLoadingPercent(this.barPos + distPerStep);
            this.barPos += distPerStep;
            if (performance.now() > endTime || this.barPos > endPos) {
                clearInterval(animateInterval);
            }
        }, 500);


        // this.endPos = endPos;
        // const startAnimateTime = performance.now();
        
        // this.endTime = startAnimateTime + time;
        // this.animating = true;
        // this.lastTime = startAnimateTime;
        
        // this.animateBar();
    }

    animateBar() {
        const now = performance.now();
        if (now > this.endTime) {
            this.animating = false;
        }
        const elapsed = now - this.lastTime;
        
        const fractionElapsed = this.endTime > now ? elapsed / (this.endTime - now) : 0;
        console.log("this: " + fractionElapsed);
        const distToFinish = this.endPos - this.barPos;
        const targetPos = 100.0 * (this.barPos + (fractionElapsed * distToFinish));
        setLoadingPercent(targetPos);
        this.barPos = targetPos;

        this.lastTime = now;
        if (this.animating) {
            requestAnimationFrame(() => {
                this.animateBar();
            });
        }
    }

    // returns promise that resolves to info as string
    convertToM4a(str) {

        // reuse experiment
        // return new Promise((resolve) => {
        //     const songData = `data:audio/x-wav;base64,${str}`;
        //     this.player.setAttribute("src", songData);
        //     let canPlayThrough = false;
        //     this.player.oncanplaythrough = () => {
        //         if (!canPlayThrough) {
        //             canPlayThrough = true;
        //             const totalSeconds = this.player.duration;
        //             const pieceSize = Math.ceil(totalSeconds / 30);
        //             this.startBarAnimate(100, 1000 + (1000 * pieceSize));
        //             const numPieces = Math.ceil(totalSeconds / pieceSize);
        //             this.pieces.forEach((piece) => {
        //                 piece.startTime = null;
        //             });
        //             let piecesMade = 0;
        //             for (let i = 0; i < numPieces; i++) {
        //                 const startTime = i * pieceSize;
        //                 this.piecePlayers[i].setAttribute("src", songData);
        //                 let piecePlayThrough = false;
        //                 this.piecePlayers[i].oncanplaythrough = () => {
        //                     if (!piecePlayThrough) {
        //                         piecePlayThrough = true;
        //                         this.piecePlayers[i].currentTime = startTime;
        //                         const chunks = [];
                                
        //                         // connect maybe
        //                         const thisCtx = new AudioContext();
        //                         const thisDest = thisCtx.createMediaStreamDestination();
        //                         const recorder = new MediaRecorder(thisDest.stream);
        //                         const thisStream = thisCtx.createMediaElementSource(this.piecePlayers[i]);
        //                         thisStream.connect(thisDest);

        //                         this.piecePlayers[i].play();
        //                         recorder.start();
        //                         setTimeout(() => {
        //                             recorder.stop();
        //                             this.piecePlayers[i].pause();
        //                         }, 1000 * pieceSize);

        //                         recorder.ondataavailable = (e) => {
        //                             chunks.push(e.data);
        //                         };

        //                         recorder.onstop = () => {
        //                             const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        //                             const reader = new FileReader();
        //                             reader.onload = (readerE) => {
        //                                 const readerStr = btoa(readerE.target.result);
        //                                 this.pieces[i].audio.setAttribute("src", `data:audio/x-wav;base64,${readerStr}`);
        //                                 let piecePlayThrough = false;
        //                                 console.log("A: " + readerStr);
        //                                 this.pieces[i].audio.oncanplaythrough = () => {
        //                                     if (!piecePlayThrough) {
        //                                         console.log("B");
        //                                         piecePlayThrough = true;
        //                                         this.pieces[i].startTime = startTime;
        //                                         piecesMade += 1;
        //                                         console.log("C " + piecesMade);
        //                                         if (piecesMade === numPieces) {
        //                                             setTimeout(() => {
        //                                                 setLoadingPercent(0);
        //                                                 this.barPos = 0;
        //                                                 resolve(this.pieces);
        //                                             }, 500);
        //                                         }
        //                                     }
        //                                 };
        //                             };
        //                             reader.readAsBinaryString(blob);
        //                         };
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // });
        // end reuse experiment
        
        return new Promise((resolve) => {
            this.startBarAnimate(25, 2000);

            const songData = `data:audio/x-wav;base64,${str}`;
            const player = new Audio(songData);

            let canPlayThrough = false;
            player.oncanplaythrough = () => {
                if (!canPlayThrough) {
                    canPlayThrough = true;
                    const totalSeconds = player.duration;
                    
                    const pieceSize = Math.ceil(totalSeconds / 30); // chunk length in seconds
                    // const pieceSize = Math.ceil(totalSeconds);

                    this.startBarAnimate(100, 1000 + (1000 * pieceSize));

                    const numPieces = Math.ceil(totalSeconds / pieceSize);
                    // const numPieces = 1;
                    const pieces = [];
                    for (let i = 0; i < numPieces; i++) {
                        pieces.push(null);
                    }
                    let piecesMade = 0;
                    
                    // for (let i = numPieces - 1; i > -1; i--) {
                    for (let i = 0; i < numPieces; i++) {
                        const startPos = i * pieceSize;
                        const pieceSongData = `data:audio/x-wav;base64,${str}`;
                        const piecePlayer = new Audio(pieceSongData);
                        let canPlay = false;
                        piecePlayer.oncanplaythrough = () => {
                            if (!canPlay) {
                                
                                canPlay = true;
                                piecePlayer.currentTime = startPos;
                                const pieceCtx = new AudioContext();
                                const dest = pieceCtx.createMediaStreamDestination();
                                const recorder = new MediaRecorder(dest.stream);
                                const stream = pieceCtx.createMediaElementSource(piecePlayer);
                                const chunks = [];
                                stream.connect(dest);
                                piecePlayer.play();
                                const startTime = piecePlayer.currentTime;
                                recorder.start();
        
                                setTimeout(() => {
                                    recorder.stop();
                                    piecePlayer.pause();
                                    
                                }, 1000 * pieceSize);
                                
                                recorder.ondataavailable = (e) => {
                                    chunks.push(e.data);
                                };
        
                                recorder.onstop = () => {
                                    
                                    const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
                                    const reader = new FileReader();
                                    reader.onload = (readerE) => {
                                    

                                        const resStr = btoa(readerE.target.result);
                                        const audio = new Audio(`data:audio/x-wav;base64,${resStr}`);
                                        const newCtx = new AudioContext();
                                        const newSource = newCtx.createMediaElementSource(audio);
                                        const newAnalyser = newCtx.createAnalyser();
                                        newSource.connect(newAnalyser);
                                        newCtx.setSinkId({ type: "none" });
                                        newAnalyser.connect(newCtx.destination);
                                        newAnalyser.fftSize = 4096;
                                        const newArray = new Uint8Array(newAnalyser.frequencyBinCount);
                                        let canOnce = false;
                                        audio.oncanplaythrough = () => {
                                            if (!canOnce) {
                                                
                                                pieceCtx.close();
                                                canOnce = true;
                                                pieces[i] = {
                                                    audio: audio,
                                                    startTime: startTime,
                                                    analyser: newAnalyser,
                                                    array: newArray,
                                                    ctx: newCtx
                                                };
                                                piecesMade += 1;
                                                if (piecesMade === numPieces) {
                                                    setTimeout(() => {
                                                        setLoadingPercent(0);
                                                        this.barPos = 0;
                                                    }, 500);
                                                    
                                                    resolve(pieces);
                                                }
                                            }
                                        }
                                    };
                                    reader.readAsBinaryString(blob);
                                };
                            }
                        };
                    }
                }
            }

            

        });
    }
}