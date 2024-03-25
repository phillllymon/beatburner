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
import {
    setElementText,
    removeElementClass,
    detectMobile,
    showSongControlButton
} from "./helpers/util.js";
import { gameDataConst } from "./data.js";

const twangs = [
    new Audio("./effects/twang6.m4a"),
    new Audio("./effects/twang9.m4a"),
];

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

let autoAdjustment = -0.05 * travelLength;

let streak = 0;

let currentSong = "";
// document.getElementById("song-label").innerText = currentSong;
let waitingForKey = false;
let songAtStart = true;

let songNotesHit = 0;
let songNotesMissed = 0;
let songStreak = 0;

let radioCode = "mvn925";
let songMode = "demo";
let sliderPos = 0;

let audioLoaded = false;

const masterInfo = {
    algorithm,
    allSlides,
    animatedBackground,
    audioLoaded,
    autoAdjustment,
    currentSong,
    maxTailLength,
    minNoteGap,
    mostRecentNotesOrTails,
    notes,
    noteSpeed,
    radioCode,
    slideLength,
    sliderPos,
    songAtStart,
    songDelay,
    songMode,
    songNotesHit,
    songNotesMissed,
    songStreak,
    streaming,
    sustainedNotes,
    tapperKeys,
    targets,
    targetBounds,
    targetTails,
    travelLength,
    vMin,
    waitingForKey
};

// ----------------------------------------- HELPERS
const noteWriter = new NoteWriter(
    masterInfo
);
const backgroundAnimator = new BackgroundAnimator(
    masterInfo
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
        showSongControlButton("button-restart");
        autoAdjustment = autoCalibrating ? -0.05 * travelLength : 0;
        masterInfo.autoAdjustment = autoAdjustment;
        document.getElementById("feedback").classList.remove("hidden");
        const fraction = 1.0 * masterInfo.songNotesHit / (masterInfo.songNotesHit + masterInfo.songNotesMissed);
        document.getElementById("percent-bar-inner-container").style.width = `${fraction * 30}vh`;
        document.getElementById("feedback-percent").innerText = `Tap accuracy: ${Math.round(fraction * 100)}%`;
        document.getElementById("feedback-streak").innerText = `Longest streak: ${masterInfo.songStreak}`;
        document.getElementById("feedback-streak-overall").innerText = `Current streak: ${streak}`;
        document.getElementById("feedback-title").innerText = masterInfo.currentSong;
        animateStats("percent-bar", ["feedback-percent", "feedback-streak", "feedback-streak-overall"]);
        masterInfo.songNotesMissed = 0;
        masterInfo.songNotesHit = 0;
        masterInfo.songStreak = 0;
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
const controlsManager = new ControlsManager(
    masterInfo,
    player,
    streamPlayer,
    animator
);
const menuManager = new MenuManager(
    masterInfo,
    controlsManager,
    player,
    stationManager,
    streamPlayer
);
const connector = new Connector(
    masterInfo,
    streamPlayer
);




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
        document.getElementById("save-settings").disabled = false;
        masterInfo.waitingForKey = false;
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
    
    if (autoCalibrating) {
        const proximity = 0.1 * masterInfo.travelLength;
        const maxAdjust = 0.15 * masterInfo.travelLength;
        if (numNotes === 1) {
            if (Math.abs(closest) < proximity) {
                autoAdjustment += 1.0 * (closest / (10 * notes.size));
                autoAdjustment = Math.max(autoAdjustment, -1 * maxAdjust);
                autoAdjustment = Math.min(autoAdjustment, 1.0 * maxAdjust);
                masterInfo.autoAdjustment = autoAdjustment;
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
    }

}

let lastNote = null;
function addNote(slideId, val, marked = false) {
    const newNote = document.createElement("div");
    newNote.classList.add("note");
    if (marked) {
        newNote.classList.add("note-marked");
        newNote.style.backgroundColor = "yellow";
    }

    let startPos = -1.0 * autoAdjustment; // should be zero initially
    
    // match previous note if super close    
    if (lastNote && !lastNote.isTail && lastNote.position < 0.05 * (masterInfo.travelLength + autoAdjustment)) {
        // newNote.style.backgroundColor = "green";
        startPos = lastNote.position;
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
    mostRecentNotesOrTails[slideId] = noteInfo;
}

let labelInUse = false;
function triggerHitNote(slideId, tapperId, hasTail) {
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
        light.appendChild(lighted);
        light.appendChild(middleLighted);
        document.getElementById(`dummy-${tapperId}`).appendChild(light);
        light.classList.add("flash");
        setTimeout(() => {
            light.remove();
        }, 1000);
    }
    
    animator.recordNoteHit();
    streak += 1;
    
    if (streak < 100) {
        const newHit = document.createElement("div");
        newHit.classList.add("hit");
        document.getElementById("streak-channel").appendChild(newHit);
    }
    if (streak > masterInfo.songStreak) {
        masterInfo.songStreak = streak;
    }
    masterInfo.songNotesHit += 1;
    const songLabel = document.getElementById("song-label");
    if (streak > 9 && streak < 200) {
        songLabel.innerText = `STREAK: ${streak}`;
    } else {
        songLabel.innerText = masterInfo.currentSong;
    }
    if (streak === 50) {
        songLabel.classList.add("font-bigA");
    }
    const rockLabel = document.getElementById("rock-label");
    if (streak === 100) {
        rockLabel.innerHTML = "100 NOTE <br> STREAK!";
        rockLabel.classList.add("rock-label");
        labelInUse = true;
        setTimeout(() => {
            rockLabel.classList.remove("rock-label");
            rockLabel.innerHTML = "";
            labelInUse = false;
        }, 1300);
        document.getElementById("streak-channel").classList.add("streak-channel-lit");
    }
    if (streak === 200) {
        document.getElementById("slides").classList.add("on-fire");
        document.getElementById("song-label").classList.add("on-fire");
        rockLabel.innerHTML = "ON FIRE!";
        rockLabel.classList.add("rock-label");
        
        labelInUse = true;
        setTimeout(() => {
            rockLabel.classList.remove("rock-label");
            rockLabel.innerHTML = "";
            labelInUse = false;
        }, 1300);
    }
    if (streak > 200) {
        if (!labelInUse) {
            rockLabel.classList.add("static-rock");
            rockLabel.innerText = streak;
        }
    }
}

function triggerMissedNote() {
    twangs[Math.floor(twangs.length * Math.random())].play();
    if (masterInfo.streaming) {
        streamPlayer.setVolume(0.3);
    } else if (masterInfo.songMode !== "radio") {
        player.setVolume(0.3);
    }
    animator.recordNoteMissed();
    removeElementClass("song-label", "font-bigA");
    setElementText("song-label", masterInfo.currentSong);
    document.getElementById("slides").classList.remove("on-fire");
    document.getElementById("song-label").classList.remove("on-fire");

    document.getElementById("streak-channel").classList.remove("streak-channel-lit");
    document.getElementById("streak-channel").innerHTML = "";
    
    
    const rockLabel = document.getElementById("rock-label");
    if (!labelInUse) {
        rockLabel.classList.remove("on-fire");
        rockLabel.classList.remove("rock-label");
    }
    rockLabel.classList.remove("static-rock");
    
    const theStreak = streak;
    if (theStreak > 25) {
        labelInUse = true;
        rockLabel.innerHTML = `${theStreak} NOTE <br> STREAK!`;
        rockLabel.classList.add("rock-label");
        setTimeout(() => {
            rockLabel.classList.remove("rock-label");
            if (theStreak > 50) {
                rockLabel.innerHTML = "YOU ROCK!";
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
    streak = 0;
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

        const newNoteSpeed = Math.floor(masterInfo.travelLength / ( (masterInfo.songDelay / 1000) / 2 ));
        masterInfo.targetBounds.top = gameDataConst.mobile.targetBounds.top * masterInfo.travelLength;
        masterInfo.targetBounds.bottom = gameDataConst.mobile.targetBounds.bottom * masterInfo.travelLength;
        masterInfo.noteSpeed = newNoteSpeed;
        masterInfo.maxTailLength = 1.0 * gameDataConst.mobile.maxTailLength * masterInfo.travelLength;
        masterInfo.slideLength = masterInfo.travelLength * 1.3;
    }, 500); // without small delay this was getting missed

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
        if (e.target.id === "dummy-left" || e.target.id === "dummy-tapper-left" || e.target.id === "a-slide-left" || e.target.id === "b-slide-left") {
            deactivateTapper("tapper-left");
        }
        if (e.target.id === "dummy-a" || e.target.id === "dummy-tapper-a" || e.target.id === "a-slide-a" || e.target.id === "b-slide-a") {
            deactivateTapper("tapper-a");
        }
        if (e.target.id === "dummy-b" || e.target.id === "dummy-tapper-b" || e.target.id === "a-slide-b" || e.target.id === "b-slide-b") {
            deactivateTapper("tapper-b");
        }
        if (e.target.id === "dummy-right" || e.target.id === "dummy-tapper-right" || e.target.id === "a-slide-right" || e.target.id === "b-slide-right") {
            deactivateTapper("tapper-right");
        }
    });
}



// stats
const session_id = Math.floor((Math.random() * 1000000000000000)).toString();

setTimeout(sendStat, 30000);
setInterval(() => {
    sendStat();
}, 180000); // update every 3 minutes
// }, 10000);

function sendStat() {
    fetch("https://beatburner.com/api/session.php", {
        method: "POST",
        body: JSON.stringify({
            session: session_id,
            mode: masterInfo.songMode
        })
    });
}

// animateStats("percent-bar-inner-container", ["feedback-percent", "feedback-streak", "feedback-streak-overall"]);
function animateStats(percentBar, stats) {
    const timeStep = 1000;
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
        document.getElementById(percentBar).style.width = `${Math.floor(fractionToUse * 100)}%`;
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