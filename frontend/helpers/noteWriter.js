export class NoteWriter {
    constructor(masterInfo, addNote, makeTail) {
        this.masterInfo = masterInfo;
        this.addNote = addNote;
        this.makeTail = makeTail;

        this.lastLeft = performance.now();
        this.lastMid = performance.now();
        this.lastRight = performance.now();
        this.leftSlides = ["slide-left", "slide-a"];
        this.rightSlides = ["slide-b", "slide-right"];
        this.rightId = "slide-right";
        this.leftId = "slide-left";
        this.lastAll = {
            "slide-left": performance.now(),
            "slide-a": performance.now(),
            "slide-b": performance.now(),
            "slide-right": performance.now()
        };
        this.mostRecentNotes = masterInfo.mostRecentNotesOrTails;

        // this.recentToneVals = [0, 0, 0];
        this.recentToneVals = [20, 50, 80];

        this.sideWithNotes = null // remember which side can have new notes when sustained note in middle of 3 slides
    
        this.last = performance.now();

        // EXPERIMENTAL
        this.gap = 200;

        // DETAIL EXPERIMENT
        this.times = [];
        this.collectArrays = [];
        this.collectTimeArrays = [];
        this.timeArrayVariances = [];
        this.startTime = performance.now();
        this.lastTime = performance.now();
        this.stepTime = 5; // ms to collapse data
        this.arrLength = 2048;
        

        // precise - hills in moment get taller
        this.aveHillHeights = [];
        this.tallestTowers = [];
        this.toneVals = [];
        

        

        // which algorithm?
        this.doPrecise = true;
    }

    writeTails(theseTowerHeights, slideIds) {
        slideIds.forEach((slideId) => {

            const lastNote = this.mostRecentNotes[slideId];
            if (lastNote) {

                // console.log(lastNote.val);
                


                // console.log("-----------");
                // console.log(lastNoteTowerHeight);
                // console.log(lastNoteTowerIdx);
                // console.log(theseTowerHeights.map(ele => ele.map(el => el)));

                let yesesToTail = [false, false, false];
                let closests = [1000, 1000, 1000];
                let closestIdxes = [null, null, null];
                let closestTowerHeights = [0, 0, 0];
                theseTowerHeights.forEach((tower) => {
                    const thisTowerHeight = tower[0];
                    const thisTowerIdx = tower[1];
                    lastNote.val.forEach((lastTower, i) => {
                        const lastTowerIdx = lastTower[1];
                        const dist = Math.abs(thisTowerIdx - lastTowerIdx);
                        if (dist < closests[i]) {
                            closests[i] = dist;
                            closestIdxes[i] = thisTowerIdx;
                            closestTowerHeights[i] = thisTowerHeight;
                        }
                    });
                });
                for (let i = 0; i < closests.length; i++) {
                    const dist = closests[i];
                    const height = closestTowerHeights[i];
                    if (dist < 4 && height > 0.5 * lastNote.val[i][0]) {
                        yesesToTail[i] = true;
                        lastNote.val[i][1] = closestIdxes[i];
                    }
                }
                let yesToTail = false;

                yesesToTail.forEach((yes) => {
                    if (yes) {
                        yesToTail = true;
                    }
                });
                // lastNote.note.innerHTML = closest;
                // lastNote.note.style.fontSize = "30px";

                if (yesToTail) {
                    this.makeTail(slideId, lastNote);
                    const now = performance.now();
                    if (slideIds.length === 4) {
                        if (this.leftSlides.includes(slideId)) {
                            this.lastLeft = now;
                            this.lastAll[slideId] = now;
                        } else {
                            this.lastRight = now;
                            this.lastAll[slideId] = now;
                        }
                    } else if (slideIds.length === 3) {
                        if (slideId === this.rightId) {
                            this.lastRight = now;
                            this.lastAll[slideId] = now;                               
                        } else if (slideId === this.leftId) {                                
                            this.lastLeft = now;
                            this.lastAll[slideId] = now;                                
                        } else {                                
                            this.lastMid = now;
                            this.lastAll[slideId] = now;                                
                        }
                    } else {
                        this.lastAll[slideId] = now;
                    }
                } else {
                    // check for tail too short - delete tail entirely
                    if (lastNote.isTail && lastNote.totalHeight < 0.1 * this.masterInfo.travelLength) {
                        lastNote.cloud.remove();
                        lastNote.note.remove();
                        lastNote.parentNote.tail = null;

                        // lastNote.parentNote.note.innerHTML = closest;
                    }
                    this.mostRecentNotes[slideId] = null;
                }
            }
        });
        
    }

    writeNotes(dataArray, timeArray, slideIds, notesPerSecond) {
        // document.getElementById("exp").style.zIndex = 10;

        // collect
        for (let i = 0; i < dataArray.length; i++) {
            const thisVal = dataArray[i];
            const thisTimeVal = timeArray[i];
            if (this.collectArrays[i] !== undefined) {
                this.collectArrays[i].push(thisVal);
                this.collectTimeArrays[i].push(thisTimeVal);
            } else {
                this.collectArrays.push([thisVal]);
                this.collectTimeArrays.push([thisTimeVal]);
            }
        }
        
        // analyze
        const now = performance.now();
        if (now - this.lastTime > this.stepTime) {
            this.times.push(now);
            
            while (this.times[0] < now - 4000) {
                this.times.shift();
            }
            
            this.lastTime += this.stepTime;

            let amt = 0;
            let arrToUse = this.collectArrays.map((subArr, i) => {
                let sum = 0;
                subArr.forEach((ele) => {
                    sum += ele;
                });
                this.collectArrays[i] = [];
                const aveVal = 1.0 * sum / subArr.length;
                amt += aveVal;
                return aveVal;
            });

            let timeArrToUse = this.collectTimeArrays.map((subArr, i) => {
                let sum = 0;
                subArr.forEach((ele) => {
                    sum += ele;
                });
                this.collectTimeArrays[i] = [];
                const aveVal = 1.0 * sum / subArr.length;
                return aveVal;
            });

            this.timeArrayVariances.push(Math.max(...timeArrToUse) - Math.min(...timeArrToUse));

            let makeNote = false;
            let marked = false;
            let colVal = false;

            // precise below
            let toneValToUse;
            let noteValToUse;
            if (this.doPrecise) {
                let prev = arrToUse[0];
                let low = prev;
                let dir = 1;
                const peaks = []; // will be populated with [val, i] ordered by val
                arrToUse.forEach((val, i) => {
                    if (val > 0) {
        
                        if (val > prev) {   // going up
                            if (dir === -1) {
                                // found a low
                                low = val;
                                dir = 1;
                            }
                        } else {    // going down
                            if (dir === 1) {
                                // found a peak
                                const height = prev - low;
                                if (height > 0) {
                                    peaks.push([height, i - 1]);
                                }
                                low = val;
                                dir = -1;
                            } else {
                                low = val;
                            }
                        }
                    }
                    prev = val;
                });

                peaks.sort((a, b) => {
                    if (a[0] > b[0]) {
                        return 1;
                    } else {
                        return -1;
                    }
                });
                
                const cutoffIdx = peaks.length * 0.9;
                const highPeaks = peaks.slice(cutoffIdx, peaks.length);
                
                this.tallestTowers.push(highPeaks);
                
                // get toneVal from average index diff between peaks
                const peakSpots = highPeaks.map((peak) => {
                    return peak[1];
                }).sort((a, b) => {
                    if (a > b) {
                        return 1;
                    } else {
                        return -1;
                    }
                });
                
                let diffSum = 0;
                for (let i = Math.floor(peakSpots.length / 5); i < peakSpots.length; i++) {
                    diffSum += peakSpots[i] - peakSpots[i - 1];
                }
                let aveDiff = 0;
                if (peakSpots.length > 1) {
                    aveDiff = diffSum / (peakSpots.length - 1);
                }
                this.toneVals.push(aveDiff);

                


                this.aveHillHeights.push(arrAverage(highPeaks.map((peak) => {
                    return peak[0]
                }))); // put latest average peak height into this.aveHillHeights
                
                if (this.aveHillHeights.length > this.times.length) {
                    this.aveHillHeights.shift();
                    this.timeArrayVariances.shift();
                    this.tallestTowers.shift();
                    this.toneVals.shift();
                }

                // now look for time hills to trigger notes
                const maxHills = 250;
                const hills = [];
                let timePrev = this.aveHillHeights[0];
                let timeDir = 1;
                let timeLow = timePrev;
                let timeLowIdx = 0;
                for (let i = 1; i < this.aveHillHeights.length; i++) {
                    const thisVal = this.aveHillHeights[i];
                    if (thisVal > timePrev) {   // going up
                        if (timeDir === -1) {
                            // found a low
                            timeLow = timePrev;
                            timeLowIdx = i - 1;
                            timeDir = 1;
                        }
                    } else {    // going down
                        if (timeDir === 1) {
                            // found a peak
                            const hillHeight = timePrev - timeLow;
                            if (hills.length === 0 || hillHeight > hills[0][0]) {
                                hills.push([hillHeight, timeLowIdx]);
                                hills.sort((a, b) => {
                                    if (a > b) {
                                        return 1;
                                    } else {
                                        return -1;
                                    }
                                });
                                // if (hills.length > maxHills) {
                                //     hills.shift();
                                // }
                            }
                        }
                        timeLow = thisVal;
                        timeLowIdx = i;
                    }
                    timePrev = thisVal;
                }

                // console.log(hills.length);

                let midIdx = 0;
                while (this.times[midIdx] < now - 1900) { // 100ms offset seems to work well
                    midIdx += 1;
                }

                noteValToUse = this.tallestTowers[midIdx].slice(this.tallestTowers[midIdx].length - 3, this.tallestTowers[midIdx].length);
                toneValToUse = this.toneVals[midIdx];

                if (this.masterInfo.sustainedNotes) {
                    this.writeTails(this.tallestTowers[midIdx], slideIds);
                } 
                
                if (this.timeArrayVariances[midIdx] < 15) {
                    return;
                }
                
                if (hills.map((hill) => {
                    return hill[1];
                }).includes(midIdx)) {
                    makeNote = true;
                }



                // const midHillHeight = this.aveHillHeights[midIdx];
                // let lower = 0;
                // let higher = 0;
                // this.aveHillHeights.forEach((height) => {
                //     if (height > midHillHeight) {
                //         higher += 1;
                //     } else {
                //         lower += 1;
                //     }
                // });

                // const thresholdRatio = 1.5;

                // if (1.0 * lower / higher > thresholdRatio) {
                //     makeNote = true;
                // }







                
                
            }


            
            if (makeNote) {

                
                const slideToRequest = this.getSlideToUse(toneValToUse, slideIds.length);
                
                this.attemptNoteWrite({
                    slideToUse: slideToRequest,
                    slideIds: slideIds,
                    noteVal: noteValToUse,
                    toneVal: toneValToUse,
                    addNote: this.addNote,
                    marked: marked,
                    mobile: true,
                    notesPerSecond: notesPerSecond
                });
            }
        }
        
    }

    getSlideToUse(toneVal, numSlides) {
        const sortedTones = this.recentToneVals.map((val) => {
            return val;
        }).sort();
        
        // exp - also involves having 16 recents instead of only 3 - see constructor
        let i = 0;
        while (toneVal > sortedTones[i]) {
            i += 1;
        }
        if (numSlides === 4 && this.recentToneVals.length === 8) {
            if (i < 2) {
                return "slide-left";
            }
            if (i < 4) {
                return "slide-a";
            }
            if (i < 6) {
                return "slide-b";
            }
            return "slide-right";
        }
        // end exp

        let slideToUse = "slide-left";
        if (numSlides === 4) {
            if (toneVal > sortedTones[0]) {
                slideToUse = "slide-a";
                if (toneVal > sortedTones[1]) {
                    slideToUse = "slide-b"
                    if (toneVal > sortedTones[2]){
                        slideToUse = "slide-right";
                    }
                }
            }
        } else if (numSlides === 3) {
            if (toneVal > sortedTones[0]) {
                slideToUse = "slide-a";
                if (toneVal > sortedTones[2]) {
                    slideToUse = "slide-right";
                }
            }
        } else {
            if (toneVal > sortedTones[1]) {
                slideToUse = "slide-right";
            }
        }
        
        return slideToUse;
    }

    attemptNoteWrite(params) {
        
        const {
            slideToUse,
            slideIds,
            noteVal,
            toneVal,
            addNote,
            marked,
            mobile,
            notesPerSecond
        } = params;
        let noteMade = false;

        let gap = this.gap;
        if (notesPerSecond > 4) {
            gap *= 0.75;
        }
        if (notesPerSecond === 2) {
            gap *= 1.5;
        }
        if (notesPerSecond === 1) {
            gap *= 2;
        }

        if (slideToUse) { // make sure note wasn't triggered in slide we're not currently using
            const now = performance.now();
            if (now - this.lastAll[slideToUse] > this.masterInfo.minNoteGap) {
                if (mobile && slideIds.length > 2) {
                    // const gap = (1.0 / notesPerSecond) * 1000;
                    if (slideIds.length === 3) {
                        // check if note is on wrong side of middle sustained note
                        if (this.mostRecentNotes["slide-a"] && this.mostRecentNotes["slide-a"].isTail) {
                            if (slideToUse !== this.sideWithNotes) {
                                return;
                            }
                        }
                        const leftTime = now - this.lastLeft;
                        const midTime = now - this.lastMid;
                        const rightTime = now - this.lastRight;
                        if (slideToUse === this.rightId) {
                            if (leftTime > gap || midTime > gap) {
                                addNote(slideToUse, noteVal, marked);
                                noteMade = true;
                                this.sideWithNotes = slideToUse;
                                this.lastRight = now;
                                this.lastAll[slideToUse] = now;
                            }
                        } else if (slideToUse === this.leftId) {
                            if (midTime > gap || rightTime > gap) {
                                addNote(slideToUse, noteVal, marked);
                                noteMade = true;
                                this.sideWithNotes = slideToUse;
                                this.lastLeft = now;
                                this.lastAll[slideToUse] = now;
                            }
                        } else {
                            if (leftTime > gap || rightTime > gap) {
                                addNote(slideToUse, noteVal, marked);
                                noteMade = true;
                                this.lastMid = now;
                                this.lastAll[slideToUse] = now;
                            }
                        }
                    } else { // we have 4 slides
                        const leftTime = now - this.lastLeft;
                        const rightTime = now - this.lastRight;
                        if (this.leftSlides.includes(slideToUse)) {
                            if (leftTime > gap) {
                                addNote(slideToUse, noteVal, marked);
                                noteMade = true;
                                this.lastLeft = now;
                                this.lastAll[slideToUse] = now;
                            }
                        } else { // we're on the right side
                            if (rightTime > gap) {
                                addNote(slideToUse, noteVal, marked);
                                noteMade = true;
                                this.lastRight = now;
                                this.lastAll[slideToUse] = now;
                            }
                        }
                    }
                } else {
                    if (notesPerSecond < 3) {
                        const leftTime = now - this.lastLeft;
                        const rightTime = now - this.lastRight;
                        if (this.leftSlides.includes(slideToUse)) {
                            if (leftTime > gap) {
                                addNote(slideToUse, noteVal, marked);
                                noteMade = true;
                                this.lastLeft = now;
                                this.lastAll[slideToUse] = now;
                            }
                        } else { // we're on the right side
                            if (rightTime > gap) {
                                addNote(slideToUse, noteVal, marked);
                                noteMade = true;
                                this.lastRight = now;
                                this.lastAll[slideToUse] = now;
                            }
                        }
                    } else {
                        addNote(slideToUse, noteVal, marked);
                        noteMade = true;
                        this.lastAll[slideToUse] = now;
                    }
                }
            }
        }

        if (noteMade) {
            // if (!this.lastValTime || performance.now() - this.lastValTime > (gap - 1)) {
                this.recentToneVals.push(toneVal);
                this.lastValTime = performance.now();
                if (this.recentToneVals.length > 8) {
                    this.recentToneVals.shift();
                }
            // }
        }

    }
}

function arrSum(arr) {
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
        total += arr[i];
    }
    return total;
}

function weightedAve(arr) {
    let num = 0;
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
        const thisVal = arr[i];
        total += i * thisVal;
        num += thisVal;
    }
    if (num === 0) {
        return 0;
    } else {
        return 1.0 * total / num;
    }
}

function arrAverage(arr) {
    let sum = 0;
    arr.forEach((ele) => {
        sum += ele;
    });
    if (arr.length === 0) {
        return 0;
    } else {
        return 1.0 * sum / arr.length;
    }
}

function arrVariance(arr) {
    const ave = arrAverage(arr);
    let sum = 0;
    arr.forEach((ele) => {
        let diff = ele - ave;
        if (diff < 0) {
            diff *= -1;
        }
        sum += diff;
    });
    if (arr.length === 0) {
        return 0;
    } else {
        return 1.0 * sum / arr.length;
    }
}