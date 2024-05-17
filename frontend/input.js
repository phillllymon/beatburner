console.log("initiating beatburner");

import { Animator } from "./helpers/animator.js";
import { BackgroundAnimator } from "./helpers/backgroundAnimator.js";
import { Connector } from "./helpers/connector.js";
import { ControlsManager } from "./helpers/controlsManager.js";
import { MenuManager } from "./helpers/menuManager.js";
import { NoteWriter } from "./helpers/noteWriter.js";
import { Player } from "./helpers/player.js";
import { StationManager } from "./helpers/stationManager.js";
import { StreamPlayer } from "./helpers/streamPlayer.js";
import { FileConverter } from "./helpers/fileConverter.js";
import { Tutorial } from "./helpers/tutorial.js";
import {
    setElementText,
    removeElementClass,
    detectMobile,
    showSongControlButton,
    getUserProfile,
    setUserProfile
} from "./helpers/util.js";
import { gameDataConst, songAuthors, songStages } from "./data.js";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const whoosh = new Audio("./effects/whoosh.m4a");
const electric = new Audio("./effects/static.m4a");
const guitar = new Audio("./effects/guitar.m4a");
const twang1 = new Audio();
const twang2 = new Audio();
const twangs = [];
twangs.push(twang1);
twangs.push(twang2);

let i1 = 0;
let play1 = false;
twang1.oncanplaythrough = () => {
    // document.getElementById("song-label").innerHTML = "PLAY 1";
    play1 = true;
};
const twang1Interval = setInterval(() => {
    if (i1 > 5) {
        clearTimeout(twang1Interval);
    }
    twang1.setAttribute("src", "./effects/twang6.m4a");
    setTimeout(() => {
        if (play1) {
            clearTimeout(twang1Interval);
        }
    }, 4000);
    i1 += 1;
}, 5000);
let i2 = 0;
let play2 = false;
twang2.oncanplaythrough = () => {
    // document.getElementById("song-label").innerHTML = "PLAY 2";
    play2 = true;
};
const twang2Interval = setInterval(() => {
    if (i2 > 5) {
        clearTimeout(twang2Interval);
    }
    twang2.setAttribute("src", "./effects/twang9.m4a");
    setTimeout(() => {
        if (play2) {
            clearTimeout(twang2Interval);
        }
    }, 4000);
    i2 += 1;
}, 5000);

setTimeout(() => {
    initialAnimate();
}, 1000);
// ^animation above

const {
    songDelay,
    allSlides,
    targetBoundSizes,
    minNoteGap,
    maxTailLength
} = gameDataConst; // from data.js

// let viewWidth = document.getElementById("game-container").clientWidth;
// let viewHeight = document.getElementById("game-container").clientHeight;
// console.log(viewWidth);
// console.log(viewHeight);
let viewWidth = document.body.clientWidth;
let viewHeight = document.body.clientHeight;
let vMin = Math.min(viewWidth, viewHeight);

let slideLength = 1.5 * vMin;
let travelLength = 1.365 * vMin;

let noteSpeed = 1.0 * (travelLength / ( (songDelay / 1000.0) / 2 ));
const targetBounds = {
    top: travelLength - (targetBoundSizes.top * travelLength),
    bottom: travelLength + (targetBoundSizes.bottom * travelLength)
}

handleMobile();
setTimeout(() => {
    document.getElementById("start-curtain").remove();
}, 1100);

const notes = new Set();

const mostRecentNotesOrTails = {
    "slide-right": null,
    "slide-left": null,
    "slide-a": null,
    "slide-b": null
};

const targets = {
    "slide-right": new Set(),
    "slide-left": new Set(),
    "slide-a": new Set(),
    "slide-b": new Set()
};

const targetTails = {
    "slide-right": null,
    "slide-left": null,
    "slide-a": null,
    "slide-b": null
};

const tapperKeys = [
    "KeyS",
    "KeyC",
    "KeyB",
    "KeyJ"
];

const activeTappers = {
    "tapper-left": false,
    "tapper-a": false,
    "tapper-b": false,
    "tapper-right": false
}

let algorithm = "A";
let autoCalibrating = true;
let sustainedNotes = true;
let animatedBackground = true;
let streaming = false;
let useShortSteps = true;

let autoAdjustment = 0;
// let autoAdjustment = -0.05 * travelLength;

let streak = 0;

let currentSong = "";
// document.getElementById("song-label").innerText = currentSong;
let waitingForKey = false;
let songAtStart = true;

let songNotesHit = 0;
let songNotesMissed = 0;
let songStreak = 0;
let longestStreak = 0;

let radioCode = "mvn925";
// let songMode = "demo";
let sliderPos = 0;

let audioLoaded = false;

let sendStat = true;
let hapticsOnHit = true;
let animations = true;
let effects = true;
let double = true;
let sustainedNotesFrequency = "few";
let canEnterCode = true;

const masterInfo = {
    algorithm,
    allSlides,
    animatedBackground,
    animations,
    audioLoaded,
    autoAdjustment,
    autoCalibrating,
    canEnterCode,
    currentSong,
    double,
    effects,
    hapticsOnHit,
    maxTailLength,
    minNoteGap,
    mostRecentNotesOrTails,
    notes,
    noteSpeed,
    radioCode,
    sendStat,
    slideLength,
    sliderPos,
    songAtStart,
    songDelay,
    // songMode,
    songNotesHit,
    songNotesMissed,
    songStreak,
    streak,
    streaming,
    sustainedNotes,
    sustainedNotesFrequency,
    tapperKeys,
    targets,
    targetBounds,
    targetTails,
    travelLength,
    useShortSteps,
    vMin,
    waitingForKey
};

// ----------------------------------------- HELPERS
const backgroundAnimator = new BackgroundAnimator(
    masterInfo
);
const noteWriter = new NoteWriter(
    masterInfo,
    addNote,
    makeTail,
    backgroundAnimator
);
const animator = new Animator(
    masterInfo,
    noteWriter,
    backgroundAnimator,
    addNote,
    makeTail,
    triggerMissedNote
);
const player = new Player(
    masterInfo,
    `aintOverYou`,
    32,
    () => {
        animator.stopAnimation();
        if (masterInfo.songStreak > longestStreak) {
            longestStreak = masterInfo.songStreak;
        }
        document.getElementById("feedback").classList.remove("hidden");
        const fraction = 1.0 * masterInfo.songNotesHit / (masterInfo.songNotesHit + masterInfo.songNotesMissed);
        document.getElementById("percent-bar-inner-container").style.width = `${100.0 * fraction}%`;
        const accuracy = Math.round(fraction * 1000) / 10.0;
        if (masterInfo.songMode === "demo") {
            reportNewScore(accuracy, masterInfo.currentSong);
        }
        if (accuracy < 90) {
            document.getElementById("song-fail").classList.remove("hidden");
            document.getElementById("song-pass").classList.add("hidden");
            document.getElementById("feedback-percent").style.color = "red";
        } else {
            document.getElementById("song-fail").classList.add("hidden");
            document.getElementById("song-pass").classList.remove("hidden");
            document.getElementById("feedback-percent").style.color = "green";
        }
        document.getElementById("feedback-title").innerText = masterInfo.currentSong;
        if (masterInfo.songMode === "demo" && songAuthors[masterInfo.songCode]) {
            document.getElementById("song-information-bar").innerHTML = songAuthors[masterInfo.songCode];
            document.getElementById("song-information-bar").classList.remove("hidden");
        } else {
            document.getElementById("song-information-bar").innerHTML = "";
            document.getElementById("song-information-bar").classList.add("hidden");
        }
        document.getElementById("feedback-title").innerText = masterInfo.currentSong;
        document.getElementById("feedback-percent").innerText = `Tap accuracy: ${accuracy}%`;
        document.getElementById("feedback-streak").innerText = `Longest streak: ${longestStreak}`;
        document.getElementById("feedback-streak-overall").innerText = `Current streak: ${masterInfo.streak}`;
        animateStats("percent-bar", ["feedback-percent-title", "feedback-streak", "feedback-streak-overall"]);
        masterInfo.songNotesMissed = 0;
        masterInfo.songNotesHit = 0;
        masterInfo.songStreak = 0;
        // alert(notesMade);
    }
);
const streamPlayer = new StreamPlayer(
    masterInfo,
    masterInfo.songDelay
);
const stationManager = new StationManager(
    masterInfo,
    streamPlayer
);
const fileConverter = new FileConverter();
const controlsManager = new ControlsManager(
    masterInfo,
    player,
    streamPlayer,
    animator,
    fileConverter,
    noteWriter
);
const menuManager = new MenuManager(
    masterInfo,
    controlsManager,
    player,
    stationManager,
    streamPlayer,
    noteWriter
);
const connector = new Connector(
    masterInfo,
    streamPlayer
);
const tutorial = new Tutorial(
    masterInfo,
    controlsManager,
    animator,
    player,
    noteWriter,
    addNote
);

// getUserProfile().then((profile) => {
//     if (!profile.animatedBackground) {
//         masterInfo.animatedBackground = false;
//         document.getElementById("toggle-background-ball").classList.add("toggle-ball-off");
//         document.getElementById("background-title").style.opacity = "0.5";
//     }
//     if (!profile.sustainedNotes) {
//         masterInfo.sustainedNotes = false;
//         document.getElementById("toggle-sustained-ball").classList.add("toggle-ball-off");
//         document.getElementById("sustained-title").style.opacity = "0.5";
//     }
//     if (!profile.autoCalibrating) {
//         masterInfo.autoCalibrating = false;
//         document.getElementById("toggle-calibration-ball").classList.add("toggle-ball-off");
//         document.getElementById("calibration-title").style.opacity = "0.5";
//     }
// });


document.isFullscreen = false;
document.wantFullscreenReturn = false;

// main
showSongControlButton("button-play");



// setup for items handled on this page
document.userFeedbackOpen = false;
document.addEventListener("keypress", (e) => {
    if (document.userFeedbackOpen) {
        return;
    }
    // e.preventDefault();
    e.stopPropagation();
    if (masterInfo.waitingForKey) {
        e.preventDefault();
        tapperKeys[masterInfo.waitingForKey[1]] = e.code;
        document.getElementById(masterInfo.waitingForKey[0]).innerText = e.code;
        const bulbId = `bulb-${masterInfo.waitingForKey[0].split("").slice(0, masterInfo.waitingForKey[0].length - 4).join("")}`;
        document.getElementById(bulbId).innerText = e.code;
        document.getElementById("save-settings").style.opacity = "1";
        masterInfo.waitingForKey = false;
        document.getElementById("change-key-message").innerText = "";
    }
    if (e.code === "Space") {
        masterInfo.spaceFunction();
    }
});

document.addEventListener("keydown", (e) => {
    if (document.userFeedbackOpen) {
        return;
    }
    if(e.code === tapperKeys[0]) {
        e.preventDefault();
        if (!targetTails["slide-left"] && !activeTappers["tapper-left"]) {
            activateTapper("tapper-left", "slide-left", "note-leaving-left");
        }
    }
    if(e.code === tapperKeys[1]) {
        e.preventDefault();
        if (!targetTails["slide-a"] && !activeTappers["tapper-a"]) {
            if (animator.slides.length === 3) {
                activateTapper("tapper-a", "slide-a", Math.random() > 0.5 ? "note-leaving-right" : "note-leaving-left");
            } else {
                activateTapper("tapper-a", "slide-a", "note-leaving-left");
            }
        }
    }
    if(e.code === tapperKeys[2]) {
        e.preventDefault();
        if (!targetTails["slide-b"] && !activeTappers["tapper-b"]) {
            activateTapper("tapper-b", "slide-b", "note-leaving-right");
        }
    }
    if(e.code === tapperKeys[3]) {
        e.preventDefault();
        if (!targetTails["slide-right"] && !activeTappers["tapper-right"]) {
            activateTapper("tapper-right", "slide-right", "note-leaving-right");
        }
    }
});

document.addEventListener("keyup", (e) => {
    if (document.userFeedbackOpen) {
        return;
    }
    if(e.code === tapperKeys[0]) {
        deactivateTapper("tapper-left");
    }
    if(e.code === tapperKeys[1]) {
        deactivateTapper("tapper-a");
    }
    if(e.code === tapperKeys[2]) {
        deactivateTapper("tapper-b");
    }
    if(e.code === tapperKeys[3]) {
        deactivateTapper("tapper-right");
    }
});

function deactivateTapper(tapperId) {
    // document.getElementById(tapperId).classList.remove("active-tapper");
    document.getElementById(tapperId).style.backgroundColor = "rgba(168,0,93,0.2)";
    activeTappers[tapperId] = false;
    const slideIds = {
        "tapper-left": "slide-left",
        "tapper-a": "slide-a",
        "tapper-b": "slide-b",
        "tapper-right": "slide-right"
    };
    const tail = targetTails[slideIds[tapperId]];
    if (tail) {
        targetTails[slideIds[tapperId]] = null;
        if (tail.height > 0.1 * maxTailLength) {
            player.setVolume(0.3);
        }
        
        tail.note.remove();
        mostRecentNotesOrTails[slideIds[tapperId]] = null;

        
        // try again in a bit
        // setTimeout(() => {
        //     const stuck = document.getElementById(`${slideIds[tapperId]}-flash-sustain`);
        //     if (stuck) {
        //         // sustain.classList.remove("flash-sustain");
        //         stuck.remove();
        //     }
        // }, 100);
    }
    const sustain = document.getElementById(`${slideIds[tapperId]}-flash-sustain`);
    if (sustain) {
        // sustain.classList.remove("flash-sustain");
        sustain.remove();
    }
}

function activateTapper(tapperId, slideId, leavingClass) {
    if (masterInfo.canEnterCode) {
        triggerCode(slideId);
    }
    activeTappers[tapperId] = true;
    let closest = 500;
    let numNotes = 0;
    let target = null;
    notes.forEach((note) => {
        if (slideId === note.slideId) {
            const thisOffset = note.position - masterInfo.travelLength;
            if (Math.abs(thisOffset) < closest) {
                target = note;
                closest = thisOffset;
                if (thisOffset < 80) {
                    numNotes += 1;
                }
            }
        }
    });
    
    if (masterInfo.autoCalibrating) {
        const proximity = 0.1 * masterInfo.travelLength;
        const maxAdjust = 0.1 * masterInfo.travelLength;
        if (numNotes === 1) {
            if (Math.abs(closest) < proximity) {
                masterInfo.autoAdjustment += 1.0 * (closest / (10 * notes.size));
                masterInfo.autoAdjustment = Math.max(masterInfo.autoAdjustment, -1 * maxAdjust);
                masterInfo.autoAdjustment = Math.min(masterInfo.autoAdjustment, 1.0 * maxAdjust);
            }
        }
    }

    // document.getElementById(tapperId).classList.add("active-tapper");
    document.getElementById(tapperId).style.backgroundColor = "rgba(255, 166, 0, 0.2)";
    const tapperTargets = targets[slideId];
    if (tapperTargets.size === 0) {
        triggerMissedNote();
    }
    if (tapperTargets.has(target)) {
        notes.delete(target);
        target.note.remove();
        target.note.classList.add(leavingClass);
        targets[slideId].delete(target);

        let hasTail = false;

        if (target.tail) {
            hasTail = true;
            targetTails[slideId] = target.tail;
            target.tail.note.classList.add("tail-active");

            target.tail.cloud.classList.remove("hidden");

            const lighted = document.createElement("div");
            lighted.classList.add("note-lighted");
            const middleLighted = document.createElement("div");
            middleLighted.classList.add("note-middle-lighted");
            const light = document.createElement("div");
            light.appendChild(lighted);
            light.appendChild(middleLighted);
            document.getElementById(`dummy-${tapperId}`).appendChild(light);
            light.classList.add("flash-sustain");
            light.id = `${slideId}-flash-sustain`;
            

            // make it look like you got the note spot on
            const perfectHeight = masterInfo.travelLength - target.tail.position;
            target.tail.note.style.height = `${perfectHeight}px`;
            target.tail.height = perfectHeight;
        }
        triggerHitNote(slideId, tapperId, hasTail);
        if (masterInfo.songMode === "tutorial") {
            tutorial.triggerNoteAttempt(true);
        }
    } else {
        if (masterInfo.songMode === "tutorial") {
            tutorial.triggerNoteAttempt(false);
        }
    }
}

function makeTail(slideId, parentNote) {
    if (parentNote.isTail) { // stretch instead of making new
        const startPos = (-1.0 * autoAdjustment);
        const additionalHeight = parentNote.position - startPos;
        parentNote.totalHeight = parentNote.totalHeight + additionalHeight;
        const newHeight = parentNote.height + additionalHeight;
        parentNote.note.style.height = `${newHeight}px`;
        parentNote.note.style.top = `${startPos - masterInfo.sliderPos}px`;
        parentNote.height = newHeight;
        parentNote.position = startPos;
        return parentNote;
    } else {
        const newTail = document.createElement("div");
        newTail.classList.add("note-tail");
        const startPos = -1.0 * autoAdjustment;
        // const startPos = -1.0 * autoAdjustment - 300;
        newTail.style.top = `${(-1.0 * masterInfo.sliderPos) + startPos}px`;
        const heightNeeded = parentNote.position - startPos;
        newTail.style.height = `${heightNeeded}px`;
        // newTail.style.height = `${300}px`;
        const newTailCloud = document.createElement("div");
        const tailInfo = {
            note: newTail,
            position: startPos,
            height: heightNeeded,
            totalHeight: heightNeeded, // running total of all height it's ever had
            slideId: slideId,
            target: false,
            val: parentNote.val,
            isTail: true,
            cloud: newTailCloud,
            parentNote: parentNote,
            tail: null
        }
        
        parentNote.tail = tailInfo;
        newTailCloud.classList.add("cloud-tail");
        newTailCloud.classList.add("hidden");
        newTail.appendChild(newTailCloud);
        document.getElementById(slideId).appendChild(newTail);
    
        mostRecentNotesOrTails[slideId] = tailInfo;
        return tailInfo;
    }

}

let lastNote = null;
let notesMade = 0;

// // TEMP
// const notesRecord = [];
// document.addEventListener("click", () => {
//     console.log(notesRecord);
// });

function addNote(slideId, val, marked = false, timeOffset = 0) {
    // notesRecord.push([slideId, player.song2.currentTime]);
    
    const newNote = document.createElement("div");
    newNote.classList.add("note");
    if (marked === true) {
        newNote.classList.add("note-marked");
        newNote.style.backgroundColor = "yellow";
    }
    if (marked && marked !== true) {
        newNote.style.backgroundColor = marked;
    }
    
    let startPos = -1.0 * autoAdjustment; // should be zero initially
    if (timeOffset > 0) {
        const travelTime = masterInfo.travelLength / 2.0;
        const fraction = 1.0 * timeOffset / travelTime;
        const distOffset = fraction * masterInfo.travelLength;
        startPos += distOffset;
    }
    
    // match previous note if super close    
    if (lastNote && !lastNote.isTail && Math.abs(lastNote.position - startPos) < 0.05 * (masterInfo.travelLength + autoAdjustment)) {
        if (masterInfo.double) {
            startPos = lastNote.position;
        } else {
            return false;
        }
    }
    
    newNote.style.top = `${(-1.0 * masterInfo.sliderPos) + startPos}px`; // FOR SLIDER
    // newNote.style.top = `${startPos}px`;
    const noteInfo = {
        note: newNote,
        position: startPos,
        slideId: slideId,
        target: false,
        val: val,   // val in the array that triggered the note to be created
        isTail: false,
        tail: null,
        seen: false
    };

    notes.add(noteInfo);
    
    document.getElementById(slideId).appendChild(newNote);

    lastNote = noteInfo;
    if (masterInfo.songMode !== "tutorial") {
        mostRecentNotesOrTails[slideId] = noteInfo;
        notesMade += 1;
        return noteInfo;
    }
}

const streakLengths = {
    1: 5,
    2: 20,
    3: 50,
    4: 100,
    5: 100
}
const hitClasses = {
    1: "hit1",
    2: "hit2",
    3: "hit3",
    4: "hit4",
    5: "hit4"
}

let labelInUse = false;
function triggerHitNote(slideId, tapperId, hasTail) {
    const streakThreshold = streakLengths[animator.notesPerSecond];
    const hitClass = hitClasses[animator.notesPerSecond];
    if (masterInfo.hapticsOnHit) {
        Haptics.impact({ style: ImpactStyle.Light });
    }
    if (masterInfo.streaming) {
        streamPlayer.setVolume(1);
    } else if (masterInfo.songMode !== "radio") {
        player.setVolume(1);
    }
    const cloudId = {
        "slide-left": "cloud-left",
        "slide-a": "cloud-a",
        "slide-b": "cloud-b",
        "slide-right": "cloud-right"
    }[slideId];
    // const cloud = document.getElementById(cloudId);
    // cloud.classList.remove("hidden");
    // cloud.classList.add("cloud");
    // setTimeout(() => {
    //     cloud.classList.remove("cloud");
    //     cloud.classList.add("hidden");
    // }, 300);

    // const noteLeaving = document.createElement("div");
    // noteLeaving.classList.add("note");
    // noteLeaving.classList.add(leavingClass);
    // document.getElementById(tapperId).appendChild(noteLeaving);

    // setTimeout(() => {
    //     noteLeaving.remove();
    // }, 600);

    if (!hasTail) {
        const lighted = document.createElement("div");
        lighted.classList.add("note-lighted");
        const middleLighted = document.createElement("div");
        middleLighted.classList.add("note-middle-lighted");
        const light = document.createElement("div");
        light.id = `${slideId}-flash`;
        light.appendChild(lighted);
        light.appendChild(middleLighted);
        document.getElementById(`dummy-${tapperId}`).appendChild(light);
        light.classList.add("flash");
        setTimeout(() => {
            light.remove();
        }, 1000);
    }
    
    animator.recordNoteHit();
    masterInfo.streak += 1;
    masterInfo.songStreak += 1;
    
    if (masterInfo.streak < streakThreshold + 1) {
        const newHit = document.createElement("div");
        newHit.classList.add(hitClass);
        document.getElementById("streak-channel").appendChild(newHit);
    }
    
    masterInfo.songNotesHit += 1;
    const songLabel = document.getElementById("song-label");
    
    if (masterInfo.songMode !== "tutorial") {
        const rockLabel = document.getElementById("rock-label");
        // if (masterInfo.streak === 100) {
        //     rockLabel.innerHTML = "100 NOTE <br> STREAK!";
        //     rockLabel.classList.add("rock-label");
        //     labelInUse = true;
        //     setTimeout(() => {
        //         rockLabel.classList.remove("rock-label");
        //         rockLabel.innerHTML = "";
        //         labelInUse = false;
        //     }, 1300);
        // }

        if (masterInfo.streak > streakThreshold) {
            document.getElementById("streak-number").innerHTML = masterInfo.streak;
        }
        if (masterInfo.streak === streakThreshold) {
            document.getElementById("streak-container").classList.remove("hidden");
            if (masterInfo.animations) {
                document.getElementById("streak-container").classList.add("bulge");
            }
            document.getElementById("streak-number").innerHTML = masterInfo.streak;
            document.getElementById("streak-channel").classList.add("streak-channel-lit");
            document.getElementById("streak-meter").classList.add("streak-meter-lit");
            // whoosh.currentTime = 0.5;
            // whoosh.volume = 0.5;
            // whoosh.play();
        }

        // if (streak === 20) {
        if (masterInfo.streak === 200) {
            document.getElementById("slides").classList.add("on-fire");
            // document.getElementById("song-label").classList.add("on-fire");
            rockLabel.innerHTML = "ON FIRE!";
            rockLabel.classList.add("rock-label");
            
            labelInUse = true;
            setTimeout(() => {
                rockLabel.classList.remove("rock-label");
                rockLabel.innerHTML = "";
                labelInUse = false;
            }, 1300);
        }
        if (masterInfo.streak > 200) {
        // if (masterInfo.streak > 20) {
            if (!labelInUse) {
                rockLabel.classList.add("static-rock");
                rockLabel.innerText = masterInfo.streak;
            }
        }
        if (masterInfo.streak === 1000) {
            rockLabel.innerHTML = "HOLY<br>SHIT!";
            // rockLabel.classList.add("rock-label");
            // rockLabel.classList.add("static-rock");
            
            labelInUse = true;
            // setTimeout(() => {
            //     rockLabel.innerHTML = "SHIT!";
            // }, 1500);
            setTimeout(() => {
                // rockLabel.classList.remove("rock-label");
                // rockLabel.innerHTML = "";
                labelInUse = false;
            }, 2000);
        }
    }
}

function triggerMissedNote() {
    if (masterInfo.songMode !== "tutorial" && masterInfo.effects) {
        twangs[Math.floor(twangs.length * Math.random())].play();
        if (masterInfo.streaming) {
            streamPlayer.setVolume(0.3);
        } else if (masterInfo.songMode !== "radio") {
            player.setVolume(0.3);
        }
    }
    animator.recordNoteMissed();
    removeElementClass("song-label", "font-bigA");
    setElementText("song-label", masterInfo.currentSong);
    document.getElementById("slides").classList.remove("on-fire");
    document.getElementById("song-label").classList.remove("on-fire");

    document.getElementById("streak-channel").classList.remove("streak-channel-lit");
    document.getElementById("streak-meter").classList.remove("streak-meter-lit");
    document.getElementById("streak-channel").innerHTML = "";
    
    
    const rockLabel = document.getElementById("rock-label");
    if (!labelInUse && masterInfo.songMode !== "tutorial") {
        rockLabel.classList.remove("on-fire");
        rockLabel.classList.remove("rock-label");
    }
    if (masterInfo.songMode !== "tutorial") {
        rockLabel.classList.remove("static-rock");
    }
    
    document.getElementById("streak-container").classList.add("hidden");
    document.getElementById("streak-container").classList.remove("bulge");
    const theStreak = masterInfo.streak;
    if (theStreak > 25) {
        labelInUse = true;
        if (masterInfo.songMode !== "tutorial") {
            rockLabel.innerHTML = `${theStreak} NOTE <br> STREAK!`;
            rockLabel.classList.add("rock-label");
            setTimeout(() => {
                rockLabel.classList.remove("rock-label");
                if (theStreak > 50) {
                    rockLabel.innerHTML = "YOU<br>ROCK!";
                    rockLabel.classList.add("rock-label");
                    setTimeout(() => {
                        rockLabel.classList.remove("rock-label");
                        rockLabel.innerHTML = "";
                        labelInUse = false;
                    }, 1300);
                } else {
                    labelInUse = false;
                }
            }, 1300);
        }
    }
    if (masterInfo.songStreak > longestStreak) {
        longestStreak = masterInfo.songStreak;
    }
    masterInfo.streak = 0;
    masterInfo.songStreak = 0;
    masterInfo.songNotesMissed += 1;
}

function handleMobile() {
    if (detectMobile()) {
        console.log("mobile woo!");
        setupMobile();
    }
}

function setupMobile() {
    document.mobile = true;
    // add mobile style
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "./style/styleMobile.css";
    document.head.appendChild(link);
    const colorLink = document.createElement("link");
    colorLink.type = "text/css";
    colorLink.rel = "stylesheet";
    colorLink.href = "./style/noteColorsMobile.css";
    document.head.appendChild(colorLink);

    [
        "fog-top-left",
        "fog-top-right",
        "fog-gradient-left",
        "fog-gradient-right"
    ].forEach((eleId) => {
        document.getElementById(eleId).remove();
    });
    
    setTimeout(() => {
        backgroundAnimator.initializeMobileBackground();
        document.getElementById("background-css").remove();

        const viewHeight = document.getElementById("game-container").clientHeight;
        masterInfo.travelLength = gameDataConst.mobile.travelLength * viewHeight;
        masterInfo.autoAdjustment = 0.05 * masterInfo.travelLength;

        // const newNoteSpeed = Math.floor(masterInfo.travelLength / ( (masterInfo.songDelay / 1000) / 2 ));
        const newNoteSpeed = 1.0 * masterInfo.travelLength / ( (masterInfo.songDelay / 1000.0) / 2.0 );
        
        masterInfo.targetBounds.top = gameDataConst.mobile.targetBounds.top * masterInfo.travelLength;
        masterInfo.targetBounds.bottom = gameDataConst.mobile.targetBounds.bottom * masterInfo.travelLength;
        masterInfo.noteSpeed = newNoteSpeed;
        masterInfo.maxTailLength = 1.0 * gameDataConst.mobile.maxTailLength * masterInfo.travelLength;
        masterInfo.slideLength = masterInfo.travelLength * 1.3;
        tReady = true;
        
    }, 1000); // without small delay this was getting missed

    [
        ["tapper-left", "slide-left", "note-leaving-left", "dummy-tapper-left", "dummy-left", "slide-left", "b-slide-left"],
        ["tapper-right", "slide-right", "note-leaving-right", "dummy-tapper-right", "dummy-right", "slide-right", "b-slide-right"],
        ["tapper-a", "slide-a", "note-leaving-left", "dummy-tapper-a", "dummy-a", "slide-a", "b-slide-a"],
        ["tapper-b", "slide-b", "note-leaving-right", "dummy-tapper-b", "dummy-b", "slide-b", "b-slide-b"]
    ].forEach((idSet) => {
        document.getElementById(idSet[3]).addEventListener("touchstart", (e) => {
            activateTapper(...idSet);
        });
        document.getElementById(idSet[4]).addEventListener("touchstart", (e) => {
            activateTapper(...idSet);
        });
        document.getElementById(idSet[5]).addEventListener("touchstart", (e) => {
            activateTapper(...idSet);
        });
        document.getElementById(idSet[6]).addEventListener("touchstart", (e) => {
            activateTapper(...idSet);
        });
    });

    document.addEventListener("touchend", (e) => {
        if (e.target.id === "dummy-left" || e.target.id === "dummy-tapper-left" || e.target.id === "a-slide-left" || e.target.id === "b-slide-left" || e.target.id === "slide-left-flash" || e.target.id === "slide-left-flash-sustain" || e.target.id === "slide-left-note-lighted") {
            deactivateTapper("tapper-left");
        }
        if (e.target.id === "dummy-a" || e.target.id === "dummy-tapper-a" || e.target.id === "a-slide-a" || e.target.id === "b-slide-a" || e.target.id === "slide-a-flash" || e.target.id === "slide-a-flash-sustain" || e.target.id === "slide-a-note-lighted") {
            deactivateTapper("tapper-a");
        }
        if (e.target.id === "dummy-b" || e.target.id === "dummy-tapper-b" || e.target.id === "a-slide-b" || e.target.id === "b-slide-b" || e.target.id === "slide-b-flash" || e.target.id === "slide-b-flash-sustain" || e.target.id === "slide-b-note-lighted") {
            deactivateTapper("tapper-b");
        }
        if (e.target.id === "dummy-right" || e.target.id === "dummy-tapper-right" || e.target.id === "a-slide-right" || e.target.id === "b-slide-right" || e.target.id === "slide-right-flash" || e.target.id === "slide-right-flash-sustain" || e.target.id === "slide-right-note-lighted") {
            deactivateTapper("tapper-right");
        }
    });

    document.getElementById("change-tapper-keys-item").classList.add("hidden");
    

}


// initialQuery
getUserProfile().then((profile) => {
    // profile.queryInitial = true; // use this to recover from situation where no stations show up
    if (profile.queryInitial) {
        fetch("https://beatburner.com/api/statusQuery.php", { method: "POST" }).then((res) => {
            res.json().then((r) => {
                if (r.message === "success") {
                    masterInfo.sendStat = r.data.queryStats;
                    profile.queryStats = r.data.queryStats;
                    profile.queryInitial = r.data.queryInitial;
                    profile.stations = r.data.stations;
                    if (r.data.messageId > profile.lastMessage) {
                        showMessage(r.data.message);
                        profile.lastMessage = r.data.messageId;
                    }
                    setUserProfile(profile).then(() => {
                        stationManager.updateStationInfo(profile.stations);
                    });
                }
            });
        }).catch((e) => {
            console.log(e.message);
        });
    } else {
        stationManager.updateStationInfo(profile.stations);
    }
});

// TEMP!!! - TODO: make modal for this
function showMessage(message) {
    alert(message);
}

// stats - commented out to assure google we collect no user data
// const session_id = Math.floor((Math.random() * 1000000000000000)).toString();

// setTimeout(sendStatHome, 30000);
// setInterval(() => {
//     sendStatHome();
// }, 180000); // update every 3 minutes


function sendStatHome() {
    if (masterInfo.sendStat) {
        fetch("https://beatburner.com/api/session.php", {
            method: "POST",
            body: JSON.stringify({
                session: session_id,
                mode: masterInfo.songMode
            })
        });
    }
}

// animateStats("percent-bar-inner-container", ["feedback-percent", "feedback-streak", "feedback-streak-overall"]);
function animateStats(percentBar, stats) {
    const timeStep = 800;
    const startTime = performance.now();
    stats.forEach((id) => {
        document.getElementById(id).style.opacity = "0";
    });
    doAnimationStep(percentBar, stats, startTime, timeStep);
}

function doAnimationStep(percentBar, stats, startTime, timeStep) {
    const now = performance.now();
    const overallTime = now - startTime;
    if (overallTime < timeStep) {
        const fractionToUse = 1.0 * overallTime / timeStep;
        document.getElementById(percentBar).style.width = `${Math.ceil(fractionToUse * 100)}%`;
    } else {
        const stepsDone = Math.floor(overallTime / timeStep);
        const statToUse = stats[stepsDone - 1];
        if (statToUse) {
            let fractionToUse = 1.0 * (overallTime - (timeStep * stepsDone)) / timeStep;
            if (fractionToUse > 0.9) {
                fractionToUse = 1;
            }
            document.getElementById(statToUse).style.opacity = `${fractionToUse}`;
        }
    }
    if (overallTime < timeStep * (1 + stats.length)) {
        requestAnimationFrame(() => {
            doAnimationStep(percentBar, stats, startTime, timeStep);
        });
    }
}

function reportNewScore(score) {
    // START HERE !!!!!!!!!!!
    // - get old profile, check score, update if higher or not there, then set profile again
    return new Promise((resolve) => {
        getUserProfile().then((profile) => {
            const levelCode = `l${animator.notesPerSecond}s${animator.slides.length}`;
            const songCode = masterInfo.songCode;
            const oldScore = profile.progress[levelCode][songCode];
            if (!oldScore) {
                profile.progress[levelCode][songCode] = score;
            } else {
                if (score > oldScore) {
                    profile.progress[levelCode][songCode] = score;
                }
            }
            setUserProfile(profile).then(() => {
                controlsManager.activateSongSelect(false);
                resolve();
            });
        });
    });
}

function initialAnimate() {
    setTimeout(() => {
        whoosh.play();
    }, 400);
    setTimeout(() => {
        electric.play();
    }, 1500);
    setTimeout(() => {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const tapperId = [
                    "tapper-left",
                    "tapper-a",
                    "tapper-b",
                    "tapper-right"
                ][Math.floor(4 * Math.random())];
                lightUp(tapperId);
            }, (1500 * Math.random()));
        }
    }, 1800);
    setTimeout(() => {
        menuManager.showMenu("source-menu");
    }, 3700);
    setTimeout(() => {
        guitar.play();
    }, 3500);
}

function lightUp(tapperId) {
    const lighted = document.createElement("div");
    lighted.classList.add("note-lighted");
    const middleLighted = document.createElement("div");
    middleLighted.classList.add("note-middle-lighted");
    const light = document.createElement("div");
    light.appendChild(lighted);
    light.appendChild(middleLighted);
    document.getElementById(`dummy-${tapperId}`).appendChild(light);
    light.classList.add("flash");
    setTimeout(() => {
        light.remove();
    }, 1000);
}

const code = [
    "slide-left",
    "slide-right",
    "slide-left",
    "slide-right",
    "slide-a",
    "slide-b",
    "slide-left",
    "slide-b",
    "slide-a",
    "slide-right"
];
let codeIdx = 0;
function triggerCode(slideId) {
    if (slideId === code[codeIdx]) {
        codeIdx += 1;
        if (!code[codeIdx]) {
            const progress = {};
            [
                "l1s2",
                "l1s3",
                "l1s4",
                "l2s2",
                "l2s3",
                "l2s4",
                "l3s2",
                "l3s3",
                "l3s4",
                "l4s2",
                "l4s3",
                "l4s4",
                "l5s2",
                "l5s3",
                "l5s4"
            ].forEach((ele) => {
                const songList = {};
                songStages.forEach((stage) => {
                    stage.forEach((song) => {
                        songList[song] = 90;
                    });
                });
                progress[ele] = songList;
            });
            getUserProfile().then((profile) => {
                profile.progress = progress;
                setUserProfile(profile).then(() => {
                    controlsManager.activateSongSelect(false);
                });
            });
        }
    } else {
        codeIdx = 0;
    }
}


// const theNotes = [];
// document.addEventListener("keydown", (e) => {
//     const slide = {
//         KeyJ: "slide-right",
//         KeyS: "slide-left",
//         KeyC: "slide-a"
//     }[e.code];
//     theNotes.push([player.song2.currentTime, slide]);
//     if (e.code === "KeyP") {
//         console.log(theNotes);
//     }
// });