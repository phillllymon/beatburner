import { 
    averageOf
} from "./util.js";

export class Animator {
    constructor(
        masterInfo,
        noteWriter,
        backgroundAnimator,
        addNote,
        makeTail,
        triggerMissedNote,
        numArrays = 4
        // numArrays = 1
    ) {
        this.masterInfo = masterInfo;
        this.delay = this.masterInfo.songDelay;
        this.recents = masterInfo.mostRecentNotesOrTails;
        this.notes = masterInfo.notes;
        this.allSlides = masterInfo.allSlides;
        this.slides = [this.allSlides[0], this.allSlides[3]];
        this.notesPerSecond = 2; // starting level note per second
        this.targetTails = masterInfo.targetTails;
        this.targets = masterInfo.targets;
        this.targetBounds = masterInfo.targetBounds;
        this.addNote = addNote;
        this.makeTail = makeTail;
        this.triggerMissedNote = triggerMissedNote;
        this.noteWriter = noteWriter;
        this.backgroundAnimator = backgroundAnimator;
        this.time = 0;
        this.animating = false;
        this.arrays = [];
        for (let i = 0; i < numArrays; i++) {
            this.arrays.push([]);
        }

        this.times = [];
        this.timeStep = 5; // ms
        this.lastTime = 0;
        

        this.noteResults = [];
        this.notesHit = 0;
        this.notesMissed = 0;
        this.arrayNow = [1, 1, 1, 1];

        this.currentSlider = "a-slider";
        this.oldSliderPos = 0;
        this.movingBothSliders = false;
    }

    setNotesPerSecond(val) {
        this.notesPerSecond = val;
    }

    setNumSlides(val) {
        if (val === 2) {
            this.slides = [this.allSlides[0], this.allSlides[3]];
        } else if (val === 3) {
            this.slides = [this.allSlides[0], this.allSlides[1], this.allSlides[3]];
        } else {
            this.slides = [this.allSlides[0], this.allSlides[1], this.allSlides[2], this.allSlides[3]];
        }
    }

    recordNoteHit() {
        this.notesHit += 1;
        this.noteResults.push(true);
        while (this.noteResults.length > 50) {
            if (this.noteResults.shift()) {
                this.notesHit -= 1;
            } else {
                this.notesMissed -= 1;
            }
        }
        updateMeter(this.notesHit, this.notesMissed);
    }

    recordNoteMissed() {
        this.notesMissed += 2;
        this.noteResults.push(false);
        this.noteResults.push(false);
        while (this.noteResults.length > 50) {
            if (this.noteResults.shift()) {
                this.notesHit -= 1;
            } else {
                this.notesMissed -= 1;
            }
        }
        updateMeter(this.notesHit, this.notesMissed);
    }

    runAnimation(params) {
        this.time = performance.now();
        this.animating = true;
        this.animate(params);
    }

    stopAnimation() {
        this.animating = false;
    }

    animate(params) {
        const {
            player,
            algorithm,
        } = params;

        const now = performance.now();
        const timesToUse = [];

        if (now - this.lastTime > 35) {
            timesToUse.push(now);
            this.lastTime = now;
        } else {
            let nextTimeToUse = this.lastTime + this.timeStep;
            while (nextTimeToUse < now) {
                timesToUse.push(nextTimeToUse);
                nextTimeToUse += this.timeStep;
                this.lastTime = nextTimeToUse;
            }
        }
        
        // console.log(timesToUse.map(ele => ele));
        
        timesToUse.forEach((timeToUse) => {
            const timeOffset = now - timeToUse;
            const delayToUse = this.delay + timeOffset;
            player.calibrateLag(delayToUse);
            const dataArray = player.getDetailedFreqArray();
            const timeArray = player.getDetailedTimeArray();
            this.noteWriter.writeNotes(dataArray, timeArray, this.slides, this.notesPerSecond, timeOffset);
        });
        
        const dt = now - this.time;
        this.time = now;
        // console.log("dt: " + dt);
        moveNotes(
            this.masterInfo.notes,
            this.masterInfo.noteSpeed,
            this.slides,
            this.targetTails,
            this.targets,
            this.masterInfo.targetBounds,
            this.triggerMissedNote,
            this.recents,
            this.masterInfo.slideLength,
            dt,
            this
        );

        if (this.animating) {
            requestAnimationFrame(() => this.animate(params));
        }
    }
}


function updateMeter(notesHit, notesMissed) {
    let fraction = 1.0 * notesHit / (notesHit + notesMissed);


    let percent = Math.floor(100 * fraction);
    if (percent < 2) {
        percent = 2;
    }
    if (percent > 98) {
        percent = 100;
        document.getElementById("skilz-channel").classList.add("skilz-channel-lit");
    } else {
        document.getElementById("skilz-channel").classList.remove("skilz-channel-lit");
    }
    document.getElementById("skilz-ball").style.top = `${100 - percent}%`;


    // const cutoff = fraction * 6;

    // for (let i = 1; i < 7; i++) { // forgive me....
    //     const lightA = document.getElementById(`light-${2 * i}`);
    //     const lightB = document.getElementById(`light-${(2 * i) - 1}`);
    //     if (i > cutoff) {
    //         lightA.classList.remove(litClasses[2 * i]);
    //         lightB.classList.remove(litClasses[(2 * i) - 1]);
    //     } else {
    //         lightA.classList.add(litClasses[2 * i]);
    //         lightB.classList.add(litClasses[(2 * i) - 1]);

    //     }
    // }


    // if (percent > 98) {
    //     percent = 100;
    //     document.getElementById("skilz-label").classList.add("skilz-label-lit");
    // } else {
    //     document.getElementById("skilz-label").classList.remove("skilz-label-lit");
    // }
    // if (percent < 2) {
    //     percent = 0;
    //     document.getElementById("skilz-light-top").classList.remove("skilz-light-top-lit");
    // } else {
    //     document.getElementById("skilz-light-top").classList.add("skilz-light-top-lit");
    // }
    // document.getElementById("skilz-beam").style.height = `${percent}%`;

    
}

function moveNotes(
    notes,
    noteSpeed,
    theSlides,
    theTargetTails,
    theTargets,
    theTargetBounds,
    triggerMissedNote,
    theRecents,
    theSlideLength,
    dt,
    obj
) {

    const movement = 1.0 * noteSpeed * (dt / 1000);
    
    // shorten targetTails
    theSlides.forEach((slideId) => {
        const tail = theTargetTails[slideId];
        if (tail) {
            const newPosition = tail.position + movement;
            // tail.note.style.top = `${newPosition}px`;
            tail.position = newPosition;
            
            const newHeight = tail.height - movement;
            if (newHeight < 0) {
                tail.note.remove();
                theTargetTails[slideId] = null;

                const sustain = document.getElementById(`${slideId}-flash-sustain`);
                if (sustain) {
                    sustain.classList.add("light-off");
                    setTimeout(() => {
                        sustain.remove();
                    }, 500);
                        
                    
                }
            }
            tail.note.style.height = `${newHeight}px`;
            tail.height = newHeight;
        }
    });
    
    // -------- periodically reset slider
    // if (sliderPos > 100000) {
    //     for (const note of notes) {
    //         document.getElementById("slider").style.top = `${sliderPos}px`;
    //         note.note.style.top = `${note.position}px`;
    //         if (note.tail) {
    //             note.tail.note.style.top = `${note.tail.position}px`;
    //         }
    //     }
    //     sliderPos = 0;
    // }

    // try switching slider instead
    if (obj.masterInfo.sliderPos > 100000) {
        
        
        let oldPref = "a-";
        let newPref = "b-";
        if (obj.currentSlider === "b-slider") {
            oldPref = "b-";
            newPref = "a-";
        }

        ["slide-left", "slide-a", "slide-b", "slide-right"].forEach((slideId) => {
            document.getElementById(slideId).id = `${oldPref}${slideId}`;
            document.getElementById(`${newPref}${slideId}`).id = slideId;
        });

        const oldSliderId = obj.currentSlider === "a-slider" ? "a-slider" : "b-slider";
        obj.currentSlider = obj.currentSlider === "a-slider" ? "b-slider" : "a-slider";
        obj.movingBothSliders = true;
        obj.oldSliderPos = obj.masterInfo.sliderPos;
        setTimeout(() => {
            obj.movingBothSliders = false;
            obj.oldSliderPos = 0;
            document.getElementById(oldSliderId).style.top = "0px";
        }, 2000);
        
        obj.masterInfo.sliderPos = 0;
    }

    // move slider
    obj.masterInfo.sliderPos += movement;
    if (obj.movingBothSliders) {
        const oldSliderId = obj.currentSlider === "a-slider" ? "b-slider" : "a-slider";
        obj.oldSliderPos += movement;
        document.getElementById(oldSliderId).style.top = `${obj.oldSliderPos}px`;
    }
    document.getElementById(obj.currentSlider).style.top = `${obj.masterInfo.sliderPos}px`;

    // move oldSlider if we have one
    if (obj.oldSlider) {
        obj.oldSliderPosition += movement;
        obj.oldSlider.style.top = `${obj.oldSliderPosition}px`;
    }
    

    // move notes
    for (const note of notes) {
        const newTop = note.position + movement;
        // note.note.style.top = `${newTop}px`;
        note.position = newTop;

        // if (newTop > masterInfo.travelLength) {
        //     notes.delete(note);

        // }

        // move tail
        if (note.tail) {
            const newTailTop = note.tail.position + movement;
            // note.tail.note.style.top = `${newTailTop}px`;
            note.tail.position = newTailTop;
        }

        if (!note.target && newTop > theTargetBounds.top && newTop < theTargetBounds.bottom) {
            theTargets[note.slideId].add(note);
            note.target = true;
            
        }
        if (newTop > theTargetBounds.bottom && note.target === true) {

            // note.note.style.backgroundColor = "green";

            note.target = false;
            theTargets[note.slideId].delete(note);
            triggerMissedNote();
            
            // delete tail once target is missed
            if (note.tail) {
                note.tail.note.remove();
                theRecents[note.tail.slideId] = null;
            }
        }
        if (newTop > theSlideLength) {   
            note.note.remove();
            notes.delete(note);
        }
    }
}