// import { aintOverYou } from "../songStrings/aintOverYou.js";
// import { burningWish } from "../songStrings/burningWish.js";
// import { cricket } from "../songStrings/cricket.js";
// import { disfigure } from "../songStrings/disfigure.js";
// import { findAWay } from "../songStrings/findAWay.js";
// import { goodLook } from "../songStrings/goodLook.js";
// import { keepYou } from "../songStrings/keepYou.js";
// import { maniaMaster } from "../songStrings/maniaMaster.js";
// import { myHeart } from "../songStrings/myHeart.js";
// import { onAndOn } from "../songStrings/onAndOn.js";
// import { romeoAndJuliet } from "../songStrings/romeoAndJuliet.js";
// import { skyHigh } from "../songStrings/skyHigh.js";
// import { stickAroundYou } from "../songStrings/stickAroundYou.js";
// import { takeMe } from "../songStrings/takeMe.js";
// import { unbreakable } from "../songStrings/unbreakable.js";

import {
    setButtonClick,
    setElementText,
    addElementClass,
    removeElementClass,
    detectMobile,
    showSongControlButton,
    showModal,
    hideModal,
    killAllNotes
} from "./util.js";
import { gameDataConst } from "../data.js";

export class ControlsManager {
    constructor(masterInfo, player, streamPlayer, animator, radioManager) {
        this.player = player;
        this.animator = animator;
        this.radioManager = radioManager;
        this.masterInfo = masterInfo;
        this.streamPlayer = streamPlayer;
        this.activateFullscreen();
        this.activateSettings();
        this.activateLevelSelector();
        this.activateSlidesSelector((newVal) => {this.animator.setNumSlides(newVal)});
        this.activateSongControls();
        this.activateSongSelection();
        this.activateCalibration();
    }

    activateCalibration() {
        const calibrateButton = document.getElementById("auto-calibrate");
        setButtonClick("auto-calibrate", () => {
            if (autoCalibrating) {
                autoCalibrating = false;
                autoAdjustment = 0;
                document.getElementById("autocalibration").innerText = "autocalibration OFF";
                calibrateButton.innerText = "Turn on autocalibration";
            } else {
                autoCalibrating = true;
                autoAdjustment = 0;
                document.getElementById("autocalibration").innerText = "autocalibration ON";
                calibrateButton.innerText = "Turn off autocalibration";
            }
        });
    }

    activateSongSelection() {
        const songSelector = document.getElementById("select-song");

        const songTitles = {
            "aintOverYou": "Ain't Over You",
            "bigWhiteLimousine": "Big White Limousine",
            "burningWish": "Burning Wish",
            "cricket": "Cricket",
            "cosmicCaravan": "Cosmic Caravan",
            "disfigure": "Disfigure",
            "findAWay": "Find a Way",
            "godOrDevil": "God or Devil",
            "goodLook": "Good Look",
            "iNeedYourLove": "I Need Your Love",
            "inTheGlowOfTheMoon": "In the Glow of the Moon",
            "keepYou": "Keep You",
            "littleGirl": "Little Girl",
            "maniaMaster": "Mania Master",
            "myHeart": "My Heart",
            "onAndOn": "On And On",
            "oneSweetDream": "One Sweet Dream",
            "romeoAndJuliet": "Romeo and Juliet",
            "secretToSell": "Secret to Sell",
            "skyHigh": "Sky High",
            "stickAroundYou": "Stick Around You",
            "takeMe": "Take Me",
            "ufo": "UFO",
            "unbreakable": "Unbreakable"
        };
        
        songSelector.addEventListener("change", (e) => {

            this.masterInfo.audioLoaded = false;
            document.getElementById("close-and-play").classList.add("hidden");
            document.getElementById("close-and-play-ghost").classList.remove("hidden");
            this.player.setPlayerReady(() => {
                document.getElementById("close-and-play").classList.remove("hidden");
                document.getElementById("close-and-play-ghost").classList.add("hidden");
                this.masterInfo.audioLoaded = true;
                this.player.setPlayerReady(() => {});
            });

            fetch(`./songStrings/${e.target.value}.txt`).then((res) => {
                res.text().then((str) => {
                    this.masterInfo.currentSong = songTitles[e.target.value];
                    this.animator.stopAnimation();
                    this.player.pause();
                    this.player.setSource(`data:audio/x-wav;base64,${str}`);
                    showSongControlButton("button-play");
                    document.getElementById("song-label").innerText = this.masterInfo.currentSong;
                    killAllNotes(this.masterInfo);

                });
            });
            
            // const newValue = songSelector.value;
            // this.masterInfo.currentSong = newValue;
            // this.animator.stopAnimation();
            // this.player.pause();
            // this.player.setSource(`./songs/${this.masterInfo.currentSong}.m4a`);
            // showSongControlButton("button-play");
            // document.getElementById("song-label").innerText = newValue;
            // killAllNotes(this.masterInfo);

        });
        
        document.getElementById("file-input").addEventListener("change", (e) => {
            this.player.pause();
            this.animator.stopAnimation();
        
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (readerE) => {
                const str = btoa(readerE.target.result);

                // console.log(str);

                const newSongData = `data:audio/x-wav;base64,${str}`;
                
                this.animator.stopAnimation();
                this.player.pause();
                this.player.setSource(newSongData);
                showSongControlButton("button-play");
                killAllNotes(this.masterInfo);
                
                this.masterInfo.currentSong = e.target.files[0].name;
                document.getElementById("song-label").innerText = this.masterInfo.currentSong;
            };
            reader.readAsBinaryString(file);
        });
    }

    activateSongControls() {
        setButtonClick("button-play", () => {
            this.playFunction();
        });
        setButtonClick("button-pause", () => {
            this.pauseFunction();
        });
        setButtonClick("button-restart", () => {
            this.restartFunction()
        });
        this.masterInfo.spaceFunction = () => {
            this.playFunction();
        };
    }
    
    playFunction() {
        if (this.masterInfo.streaming || this.masterInfo.songMode === "radio") {
            this.streamPlayer.start();
            this.animator.runAnimation({ player: this.streamPlayer, algorithm: this.masterInfo.algorithm });
        } else {
            this.player.start();
            this.animator.runAnimation({ player: this.player, algorithm: this.masterInfo.algorithm });
        }
        showSongControlButton("button-pause");
        this.masterInfo.spaceFunction = () => {
            this.pauseFunction();
        };
    }
    pauseFunction() {
        if (this.masterInfo.streaming || this.masterInfo.songMode === "radio") {
            this.streamPlayer.stop();
            killAllNotes(this.masterInfo);
        } else {
            this.player.pause();
        }
        this.animator.stopAnimation();
        showSongControlButton("button-play");
        this.masterInfo.spaceFunction = () => {
            this.playFunction();
        };
    }
    restartFunction() {
        this.player.restart();
        this.animator.stopAnimation();
        showSongControlButton("button-play");
        killAllNotes(this.masterInfo);
        this.masterInfo.spaceFunction = () => {
            this.playFunction();
        }
    }

    activateSlidesSelector(setNumSlides) {
        [
            ["slides-2", 2],
            ["slides-3", 3],
            ["slides-4", 4]
        ].forEach((slideSet) => {
            const slidesButton = document.getElementById(slideSet[0]);
            slidesButton.addEventListener("click", () => {
                this.deselectSlides();
                this.selectSlides(slideSet[1], setNumSlides);
                slidesButton.classList.add("level-selected");
            })
        });
        document.getElementById("slides-3").classList.add("level-selected");
        this.selectSlides(3, setNumSlides);
    }

    deselectSlides() {
        ["slides-2", "slides-3", "slides-4"].forEach((num) => {
            document.getElementById(num).classList.remove("level-selected");
        });
    }

    selectSlides(n, setNumSlides) {
        const slideA = document.getElementById("slide-a");
        const slideB = document.getElementById("slide-b");
        const aSlideA = document.getElementById("a-slide-a");
        const aSlideB = document.getElementById("a-slide-b");
        const bSlideA = document.getElementById("b-slide-a");
        const bSlideB = document.getElementById("b-slide-b");
        const clearSlideA = document.getElementById("clear-slide-a");
        const clearSlideB = document.getElementById("clear-slide-b");
        const dummyA = document.getElementById("dummy-a");
        const dummyB = document.getElementById("dummy-b");
        const dummyTapperA = document.getElementById("dummy-tapper-a-container");
        const dummyTapperB = document.getElementById("dummy-tapper-b-container");
        const slidesContainer = document.getElementById("slides-container");
        
        if (n === 2) {
            
            setNumSlides(2);
            if (slideA) {
                slideA.classList.add("hidden");
                slideB.classList.add("hidden");
            }
            if (aSlideA) {
                aSlideA.classList.add("hidden");
                aSlideB.classList.add("hidden");
            }
            if (bSlideA) {
                bSlideA.classList.add("hidden");
                bSlideB.classList.add("hidden");
            }
            clearSlideA.classList.add("hidden");
            clearSlideB.classList.add("hidden");
            dummyA.classList.add("hidden");
            dummyB.classList.add("hidden");
            dummyTapperA.classList.add("hidden");
            dummyTapperB.classList.add("hidden");
    
            slidesContainer.classList.remove("three-wide-slides-container");
            slidesContainer.classList.remove("four-wide-slides-container");
        }
        if (n === 3) {
            setNumSlides(3);
            document.getElementById("slides-container").classList.add("three-wide-slides-container");
            if (slideA) {
                slideA.classList.remove("hidden");
                slideB.classList.add("hidden");
            }
            if (aSlideA) {
                aSlideA.classList.remove("hidden");
                aSlideB.classList.add("hidden");
            }
            if (bSlideA) {
                bSlideA.classList.remove("hidden");
                bSlideB.classList.add("hidden");
            }
            clearSlideA.classList.remove("hidden");
            clearSlideB.classList.add("hidden");
            dummyA.classList.remove("hidden");
            dummyB.classList.add("hidden");
            dummyTapperA.classList.remove("hidden");
            dummyTapperB.classList.add("hidden");
    
            slidesContainer.classList.add("three-wide-slides-container");
            slidesContainer.classList.remove("four-wide-slides-container");
        }
        if (n === 4) {
            setNumSlides(4);
            if (slideA) {
                slideA.classList.remove("hidden");
                slideB.classList.remove("hidden");
            }
            if (aSlideA) {
                aSlideA.classList.remove("hidden");
                aSlideB.classList.remove("hidden");
            }
            if (bSlideA) {
                bSlideA.classList.remove("hidden");
                bSlideB.classList.remove("hidden");
            }
            clearSlideA.classList.remove("hidden");
            clearSlideB.classList.remove("hidden");
            dummyA.classList.remove("hidden");
            dummyB.classList.remove("hidden");
            dummyTapperA.classList.remove("hidden");
            dummyTapperB.classList.remove("hidden");
    
            slidesContainer.classList.remove("three-wide-slides-container");
            slidesContainer.classList.add("four-wide-slides-container");
        }
    }

    activateLevelSelector() {
        [
            // ["level-1", 2],
            // ["level-2", 4],
            // ["level-3", 6],
            // ["level-4", 8],
            // ["level-5", 10]
            ["level-1", 1],
            ["level-2", 2],
            ["level-3", 3],
            ["level-4", 4],
            ["level-5", 5]
        ].forEach((levelSet) => {
            setButtonClick(levelSet[0], () => {
                ["level-1", "level-2", "level-3", "level-4", "level-5"].forEach((level) => {
                    removeElementClass(level, "level-selected");
                });
                this.animator.setNotesPerSecond(levelSet[1]);
                addElementClass(levelSet[0], "level-selected");
            });
        });
        addElementClass("level-2", "level-selected");
    }

    activateSettings() {
        setButtonClick("show-settings", () => {
            showModal("settings");
        });
        setButtonClick("save-settings", () => {
            hideModal("settings");
        });
        const keyInfo = [
            ["change-left", "left-key"],
            ["change-a", "a-key"],
            ["change-b", "b-key"],
            ["change-right", "right-key"]
        ];
        for (let i = 0; i < keyInfo.length; i++) {
            setElementText(keyInfo[i][1], this.masterInfo.tapperKeys[i]);
            setButtonClick(keyInfo[i][0], () => {
                setElementText(keyInfo[i][1], "-");
                document.getElementById("save-settings").disabled = true;
                this.masterInfo.waitingForKey = ([keyInfo[i][1], i]);
            });
        }
        setButtonClick("switch-algorithm", () => {
            if (this.masterInfo.algorithm === "A") {
                this.masterInfo.algorithm = "B";
                setElementText("algorithm", "using algorithm B");
            } else {
                this.masterInfo.algorithm = "A";
                setElementText("algorithm", "using algorithm A");
            }
        });
        setButtonClick("sustained-toggle", () => {
            if (this.masterInfo.sustainedNotes) {
                this.masterInfo.sustainedNotes = false;
                setElementText("sustained", "sustained notes OFF");
                setElementText("sustained-toggle", "Turn on sustained notes");
            } else {
                this.masterInfo.sustainedNotes = true;
                setElementText("sustained", "sustained notes ON");
                setElementText("sustained-toggle", "Turn off sustained notes");
            }
        });
        setButtonClick("toggle-animate", () => {
            if (this.masterInfo.animatedBackground) {
                this.masterInfo.animatedBackground = false;
                setElementText("animated", "animated background OFF");
                setElementText("toggle-animate", "Turn on animated background");
            } else {
                this.masterInfo.animatedBackground = true;
                setElementText("animated", "animated background ON");
                setElementText("toggle-animate", "Turn off animated background");
            }
        });
    }

    activateFullscreen() {
        setButtonClick("full-screen", () => {
            this.toggleFullscreen();
        });
        document.addEventListener("fullscreenchange", () => {
            if (document.isFullscreen) {
                document.isFullscreen = false;
                ["full-top-left-quad", "full-top-right-quad", "full-bottom-left-quad", "full-bottom-right-quad"].forEach((eleId) => {
                    document.getElementById(eleId).classList.remove("turned-inward");
                });
            } else {
                document.isFullscreen = true;
                ["full-top-left-quad", "full-top-right-quad", "full-bottom-left-quad", "full-bottom-right-quad"].forEach((eleId) => {
                    document.getElementById(eleId).classList.add("turned-inward");
                });
            }
            this.recalculateLengths();
        });
    }

    toggleFullscreen() {
        return new Promise((resolve) => {
            if (document.isFullscreen) {
                document.exitFullscreen().then(() => {
                    resolve();
                });
            } else {
                document.getElementById("game-container").requestFullscreen().then(() => {
                    resolve();
                });
            }
        });
    }

    recalculateLengths() {
        setTimeout(() => {

            if (detectMobile()) {
                const viewHeight = document.getElementById("game-container").clientHeight;
                this.masterInfo.travelLength = gameDataConst.mobile.travelLength * viewHeight;
    
                const newNoteSpeed = Math.floor(this.masterInfo.travelLength / ( (this.masterInfo.songDelay / 1000) / 2 ));
                this.masterInfo.targetBounds.top = gameDataConst.mobile.targetBounds.top * this.masterInfo.travelLength;
                this.masterInfo.targetBounds.bottom = gameDataConst.mobile.targetBounds.bottom * this.masterInfo.travelLength;
                this.masterInfo.noteSpeed = newNoteSpeed;
                this.masterInfo.maxTailLength = 1.0 * gameDataConst.mobile.maxTailLength * this.masterInfo.travelLength;
                this.masterInfo.slideLength = this.masterInfo.travelLength * 1.3;
            } else {
    
                const viewH = document.getElementById("game-container").clientHeight;
                const viewW = document.getElementById("game-container").clientWidth;
                let min = Math.min(viewW, viewH);
    
                this.masterInfo.vMin = min;
    
                this.masterInfo.slideLength = 1.5 * min;
                this.masterInfo.travelLength = 1.365 * min;
                const newNoteSpeed = 1.0 * this.masterInfo.travelLength / ( (this.masterInfo.songDelay / 1000) / 2 );
                this.masterInfo.targetBounds.top = gameDataConst.mobile.targetBounds.top * this.masterInfo.travelLength;
                this.masterInfo.targetBounds.bottom = gameDataConst.mobile.targetBounds.bottom * this.masterInfo.travelLength;
                this.masterInfo.noteSpeed = newNoteSpeed;
                this.masterInfo.maxTailLength = 1.0 * gameDataConst.mobile.maxTailLength * this.masterInfo.travelLength;
                this.masterInfo.slideLength = this.masterInfo.travelLength * 1.3;
            }
        }, 500)
    }
}