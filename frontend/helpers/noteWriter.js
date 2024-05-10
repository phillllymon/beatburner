export class NoteWriter {
    constructor(masterInfo, addNote, makeTail, backgroundAnimator) {
        this.masterInfo = masterInfo;
        this.addNote = addNote;
        this.makeTail = makeTail;
        this.backgroundAnimator = backgroundAnimator;

        this.lastLeft = performance.now();
        this.lastMid = performance.now();
        this.lastRight = performance.now();
        this.lastLeftTail = performance.now();
        this.lastMidTail = performance.now();
        this.lastRightTail = performance.now();
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
        this.lastAlls = [];
        this.mostRecentNotes = masterInfo.mostRecentNotesOrTails;

        this.numToneVals = 5;
        // this.recentToneVals = [80];
        // this.recentToneVals = [20, 50, 80];
        // this.recentToneVals = [20, 20, 20, 50, 50, 80, 80, 80];
        this.recentToneVals = [20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80];
        // this.recentToneVals = [
        //     20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80,
        //     20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80,
        //     20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80,
        //     20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80
        // ];


        this.sideWithNotes = null // remember which side can have new notes when sustained note in middle of 3 slides
    
        this.last = performance.now();
        this.timeSinceLast = 0;
        this.timesSinceLast = [0, 0, 0, 0];

        this.lastArrs = [];

        this.rawArrs = [];
        // this.highestFreqs = []; // [idx, val]

        // EXPERIMENTAL
        this.gap = 200;

        this.resetData();
        // // DETAIL EXPERIMENT
        // this.times = [];
        // this.collectArrays = [];
        // this.collectTimeArrays = [];
        // this.timeArrayVariances = [];
        // this.startTime = performance.now();
        // this.lastTime = performance.now();
        // this.stepTime = 5; // ms to collapse data
        // this.arrLength = 2048;
        

        // // precise - hills in moment get taller
        // this.aveHillHeights = [];
        // this.tallestTowers = [];
        // this.toneVals = [];
        // this.peakOffset = 0;

        // // precise better - same but with running total
        // this.prev = false;
        // this.low = false;
        // this.lowIdx = false;
        // this.dir = 1;

        // which algorithm?
        this.doPreciseBetter = true;
    }

    resetData() {
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
        this.peakOffset = 0;

        // precise better - same but with running total
        this.prev = false;
        this.low = false;
        this.lowIdx = false;
        this.dir = 1;
    }

    writeTails(theseTallestTowers, slideIds, futureTallestTowers, notesPerSecond) {
        if (this.recentToneVals.length < 5 || notesPerSecond < 2) {
            return;
        }
        
        slideIds.forEach((slideId) => {

            
            const lastNote = this.mostRecentNotes[slideId];
            if (lastNote) {

                let reachDist = 8; // larger number means more sustained notes
                if (this.masterInfo.songMode === "radio") {
                    reachDist = 4;
                }
                let noteValToUse = lastNote.val;
                if (noteValToUse.length > 8) {
                    noteValToUse = noteValToUse.slice(Math.floor(0.25 * noteValToUse.length), Math.floor(0.75 * noteValToUse.length));
                }

                let yesToTail = false;

                const theseTowerLocations = new Set();
                theseTallestTowers.forEach((tower) => {
                    theseTowerLocations.add(tower[1]);
                });
                let towersFound = 0;
                // const towersNeeded = Math.ceil(noteValToUse.length / 6);
                const towersNeeded = Math.ceil(noteValToUse.length / 1);
                noteValToUse.forEach((tower) => {
                    const loc = tower[1];
                    let towerFound = false;
                    const locArr = [];
                    for (let i = 0; i < reachDist; i++) {
                        locArr.push(loc - i);
                        locArr.push(loc + i);
                    }
                    locArr.forEach((closeNum) => {
                        if (theseTowerLocations.has(closeNum)) {
                            towerFound = true;
                            theseTowerLocations.delete(closeNum);
                            theseTowerLocations.add(loc);
                        }
                    });
                    if (towerFound) {
                        towersFound += 1;
                    }
                });

                let futurePass = false;
                if (lastNote.isTail) {
                    futurePass = true;
                } else {
                    futurePass = true;
                    futureTallestTowers.forEach((tallestTowersArr) => {
                        const futureTowerLocations = new Set();
                        tallestTowersArr.forEach((tower) => {
                            futureTowerLocations.add(tower[1]);
                        });
                        let towersFound = 0;
                        noteValToUse.forEach((tower) => {
                            const loc = tower[1];
                            let towerFound = false;
                            const locArr = [];
                            for (let i = 0; i < reachDist; i++) {
                                locArr.push(loc - i);
                                locArr.push(loc + i);
                            }
                            locArr.forEach((closeNum) => {
                                if (futureTowerLocations.has(closeNum)) {
                                    towerFound = true;
                                    futureTowerLocations.delete(closeNum);
                                    futureTowerLocations.add(loc);
                                }
                            });
                            if (towerFound) {
                                towersFound += 1;
                            }
                        });
                        if (towersFound < towersNeeded) {
                            futurePass = false;
                        }
                    });
                }

                let notTooLong = true;
                if (lastNote.isTail) {
                    if (lastNote.totalHeight > 1.5 * this.masterInfo.travelLength) {
                        notTooLong = false;
                    }
                }

                if (towersFound >= towersNeeded && futurePass && notTooLong) {
                    yesToTail = true;
                }

                if (yesToTail) {
                    const now = performance.now();
                    if (slideIds.length === 4) {
                        if (this.leftSlides.includes(slideId)) {
                            this.lastLeft = now;
                            this.lastAll[slideId] = now;
                            this.makeTail(slideId, lastNote);
                        } else {
                            this.lastRight = now;
                            this.lastAll[slideId] = now;
                            this.makeTail(slideId, lastNote);
                        }
                    } else if (slideIds.length === 3) {
                        if (slideId === this.rightId) {
                            this.lastRight = now;
                            this.lastAll[slideId] = now;
                            this.makeTail(slideId, lastNote);                             
                        } else if (slideId === this.leftId) {                                
                            this.lastLeft = now;
                            this.lastAll[slideId] = now;
                            this.makeTail(slideId, lastNote);                                
                        } else {                                
                            this.lastMid = now;
                            this.lastAll[slideId] = now;
                            this.makeTail(slideId, lastNote);                                
                        }
                    } else {
                        this.lastAll[slideId] = now;
                        this.makeTail(slideId, lastNote);
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

    writeNotes(dataArray, timeArray, slideIds, notesPerSecond, timeOffset = 0) {
        
        // console.log(dataArray.map(ele => ele));
        
        const now = performance.now() - timeOffset;
        // if (now - this.lastTime > this.stepTime) {
            this.times.push(now);
            
            while (this.times[0] < now - 4000) {
                this.times.shift();
            }
            
            this.lastTime += this.stepTime;

            
            let makeNote = false;
            let marked = false;
            let colVal = false;
            
            // FOR NO COLLECT ARRAY!!!!
            const arrToUse = dataArray;
            // const arrToUse = timeArray;

            const timeArrToUse = timeArray;
            this.timeArrayVariances.push(Math.max(...timeArrToUse) - Math.min(...timeArrToUse));
            
            // precise below
            let toneValToUse;
            let noteValToUse;
            

            // precise better
            if (this.doPreciseBetter) {
                let prev = arrToUse[0];
                let low = prev;
                let dir = 1;
                const peaks = []; // will be populated with [val, i] ordered by val

                // FOR highestFreqs
                // let maxVal = 0;
                // let maxValIdx = 0;

                arrToUse.forEach((val, i) => {
                    if (val > 0) {

                        // FOR higestFreqs
                        // if (val > maxVal) {
                        //     maxVal = val;
                        //     maxValIdx = 0;
                        // }
        
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

                // FOR higestFreqs
                // this.highestFreqs.push([maxValIdx, maxVal]);

                // peaks.sort((a, b) => {
                //     if (a[0] > b[0]) {
                //         return 1;
                //     } else {
                //         return -1;
                //     }
                // });
                
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

                // this.aveHillHeights.push(arrAverage(highPeaks.map((peak) => {
                //     return peak[0];
                // }))); // put latest average peak height into this.aveHillHeights

                // MAX INSTEAD OF AVE hill height
                this.aveHillHeights.push(Math.max(...highPeaks.map((peak) => {
                    return peak[0];
                }))); // put latest average peak height into this.aveHillHeights

                // EQUALIZER TEMP!!!!
                // const equals = [
                //     Math.max(...arrToUse.slice(0, 512)),
                //     Math.max(...arrToUse.slice(512, 1024)),
                //     Math.max(...arrToUse.slice(1024, 1536)),
                //     Math.max(...arrToUse.slice(1536, 2048))
                //     // arrAverage(arrToUse.slice(0, 512)),
                //     // arrAverage(arrToUse.slice(512, 1024)),
                //     // arrAverage(arrToUse.slice(1024, 1536)),
                //     // arrAverage(arrToUse.slice(1536, 2048))
                // ];
                // this.lastEquals.push(equals);
                this.rawArrs.push(arrToUse);
                // END TEMP - but see this.lastEquals below
                

                if (this.aveHillHeights.length > this.times.length) {
                    this.aveHillHeights.shift();
                    this.timeArrayVariances.shift();
                    this.tallestTowers.shift();
                    this.toneVals.shift();
                    // this.lastEquals.shift(); /////////// TEMP
                    this.rawArrs.shift(); /////////// TEMP
                    // this.highestFreqs.shift();
                }

                // FOR highestFreqs
                // let highestPeakVal = 0;
                // let highestPeakIdx = 0;
                // this.highestFreqs.forEach((peakArr) => {
                //     if (peakArr[1] > highestPeakVal) {
                //         highestPeakVal = peakArr[1];
                //         highestPeakIdx = peakArr[0];
                //     }
                // });
                
                let zoomInFactor = 4;
                // let zoomInFactor = 6;
                if (this.times[this.times.length - 1] - this.times.length[0] < 3900 || this.times.length < 100) {
                    zoomInFactor = 1;
                }

                // now look for time hills to trigger notes
                const maxHills = 100;
                const hills = [];
                const hillPeakIdxs = {}; // filled with idx: peakIdx
                let timePrev = this.aveHillHeights[0];
                let timeDir = 1;
                let timeLow = timePrev;
                let timeLowIdx = 0;

                const legLength = Math.floor(this.aveHillHeights.length / (2 * zoomInFactor));
                const startIdx = Math.floor(this.aveHillHeights.length / 2 - legLength);
                const endIdx = Math.floor(this.aveHillHeights.length / 2 + legLength);


                // for (let i = 1; i < this.aveHillHeights.length; i++) {
                for (let i = startIdx; i < endIdx; i++) {
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
                            // if (hills.length === 0 || hillHeight > hills[0][0]) {
                            if (hillHeight > 0) {

                                
                                // const prominance = this.timeArrayVariances[i] - this.timeArrayVariances[timeLowIdx];
                                // hills.push([hillHeight, timeLowIdx, prominance]); // prominance by loudness at top of hill vs bottom

                                hills.push([hillHeight, timeLowIdx, this.timeArrayVariances[i]]); // timeArrayVariances for loudness for prominance
                                // hills.push([hillHeight, timeLowIdx, this.rawArrs[i][highestPeakIdx]]); // prominance by prominance of most prominant frequency
                                // hills.push([hillHeight, timeLowIdx, this.timeArrayVariances[i] * hillHeight]); // loudness * height

                                
                                hillPeakIdxs[timeLowIdx] = i - timeLowIdx;
                            }
                        }
                        timeLow = thisVal;
                        timeLowIdx = i;
                    }
                    timePrev = thisVal;
                }
                // console.log(hills.map(ele => ele.map(el => el)));

                // SORT HILLS JUST ONCE, after they're all gathered
                hills.sort((a, b) => {
                    // if (a[0] > b[0]) {
                    if (a[2] > b[2]) { /////// TEMP TEMP TEMP TEMP - use prominance
                        return 1;
                    } else {
                        return -1;
                    }
                });
                // console.log(hills.length);

                let midIdx = 0;
                let realMidIdx = 0;
                while (this.times[midIdx] < now - 1900) { // 100ms offset seems to work well
                    midIdx += 1;
                    if (this.times[midIdx] < now - 2000) {
                        realMidIdx += 1;
                    }
                }

                const peakIdx = hillPeakIdxs[midIdx] + midIdx;
                if (peakIdx) {
                    this.peakOffset = hillPeakIdxs[midIdx];
                }

                // noteValToUse = this.tallestTowers[midIdx + this.peakOffset].slice(
                //     this.tallestTowers[midIdx + this.peakOffset].length - 10, 
                //     this.tallestTowers[midIdx + this.peakOffset].length - 0
                // );
                noteValToUse = this.tallestTowers[midIdx + this.peakOffset];
                toneValToUse = arrAverage(this.tallestTowers[midIdx + this.peakOffset].map((sub) => {
                    return sub[0];
                }));
                
                // toneValToUse = this.toneVals[peakIdx]; // TEMP TEMP TEMP TEMP TEMP TEMP TEMP TEMP
                // if (this.rawArrs[peakIdx]) {
                //     // toneValToUse = weightedAve(this.rawArrs[peakIdx].slice(0, 2048));
                //     // average indices of top 10 

                //     // toneValToUse = Math.max(...this.rawArrs[peakIdx].slice(150, 2048));
                //     // // attempt to do ^that for real;
                //     let max = 0;
                //     let maxIdx = 0;
                //     this.rawArrs[peakIdx].forEach((val, i) => {
                //         if (val > max) {
                //             max = val;
                //             maxIdx = i;
                //         }
                //     });
                //     toneValToUse = maxIdx;
                // } else {
                //     toneValToUse = 1;
                // }



                

                
                const timePerStep = 4000 / this.tallestTowers.length;
                let numFutureSteps = Math.ceil(200 / timePerStep);


                if (this.masterInfo.sustainedNotes) {
                    this.writeTails(
                        this.tallestTowers[midIdx + this.peakOffset],
                        slideIds, 
                        this.tallestTowers.slice(midIdx + this.peakOffset + 1, midIdx + this.peakOffset + 1 + numFutureSteps),
                        notesPerSecond
                    );
                } 
                
                // too quiet
                if (this.timeArrayVariances[midIdx] < 15) {
                    return;
                }

                const maxV = Math.max(...this.aveHillHeights);
                const minV = Math.min(...this.aveHillHeights);
                const midV = (1.0 * maxV + minV) / 2;
                const range = maxV - minV;
                const v = this.aveHillHeights[this.aveHillHeights.length - 1];
                const fraction = 1.0 * (v - minV) / range;
                
                // const cutoff = {
                //     1: 0.95,
                //     2: 0.75,
                //     3: 0.5,
                //     4: 0,
                //     5: 0
                // }[notesPerSecond];

                let cutoff = {
                    1: 0.93,
                    2: 0.82,
                    3: 0.75,
                    4: 0.5,
                    5: 0.25
                }[notesPerSecond];

                // for zoomInFactor
                // cutoff = 1 - ((1.0 - cutoff) / zoomInFactor);

                if (slideIds.length === 3) {
                    let cutoffDiff = 1 - cutoff;
                    cutoffDiff *= 0.75;
                    cutoff = 1 - cutoffDiff;
                }
                if (slideIds.length === 2) {
                    let cutoffDiff = 1 - cutoff;
                    cutoffDiff *= 0.5;
                    cutoff = 1 - cutoffDiff;
                }

                // number version (instead of fraction version)
                let numNotes = {
                    1: 4,
                    2: 7,
                    3: 10,
                    4: 15,
                    5: 20
                }[notesPerSecond];
                if (slideIds.length === 3) {
                    numNotes *= 0.75;
                }
                if (slideIds.length === 2) {
                    numNotes *= 0.5;
                }

                if (hills.slice(Math.floor(hills.length - numNotes), hills.length - 1).map((hill) => {
                // if (hills.slice(Math.floor(cutoff * hills.length), hills.length - 1).map((hill) => {
                    return hill[1];
                }).includes(midIdx)) {
                    makeNote = true;
                }

                this.lastAlls.push({
                    "slide-left": (now - this.lastAll["slide-left"]),
                    "slide-a": (now - this.lastAll["slide-a"]),
                    "slide-b": (now - this.lastAll["slide-b"]),
                    "slide-right": (now - this.lastAll["slide-right"])
                });
                if (this.lastAlls.length > this.times.length) {
                    this.lastAlls.shift();
                }

                const thisBackArr = [
                    Math.pow(arrAverage(arrToUse.slice(arrToUse.length - 2048, arrToUse.length - 1536)), 1.5),
                    Math.pow(arrAverage(arrToUse.slice(arrToUse.length - 1536, arrToUse.length - 1024)), 1.5),
                    Math.pow(arrAverage(arrToUse.slice(arrToUse.length - 1024, arrToUse.length - 512)), 1.5),
                    Math.pow(arrAverage(arrToUse.slice(arrToUse.length - 512, arrToUse.length - 256)), 1.5)
                ];
                this.lastArrs.push(thisBackArr);
                if (this.lastArrs.length > 8) {
                    this.lastArrs.shift();
                }
                const backArrToUse = [];
                for (let i = 0; i < thisBackArr.length; i++) {
                    backArrToUse.push(arrAverage(this.lastArrs.map((sub) => {
                        return sub[i];
                    })));
                }
                this.backgroundAnimator.animateBackground(backArrToUse);

                // FOR highestFreqs
                // const stepsEachSide = 30;
                // if (this.rawArrs.length > 2 * stepsEachSide + 50) {
                //     const littleArrToUse = this.rawArrs.slice(midIdx - stepsEachSide, midIdx + stepsEachSide);
                //     let maxIdx = 0;
                //     let maxVal = 0;
                //     littleArrToUse.forEach((subArr, i) => {
                //         const freqVal = subArr[highestPeakIdx];
                //         if (freqVal > maxVal) {
                //             maxVal = freqVal;
                //             maxIdx = i;
                //         }
                //     });
                //     if (maxIdx === Math.floor(littleArrToUse.length / 2)) {
                //         marked = true;
                //         makeNote = true;
                //     } else {
                //         makeNote = false;
                //     }
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
        // }
        
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

        // TEMP!!!!!
        // if (numSlides === 4 && this.lastEquals.length > 10) {
        //     const midIdx = Math.floor(this.lastEquals.length / 2);
        //     const midEquals = this.lastEquals[midIdx];
        //     const lastEquals = this.lastEquals[midIdx - 1];
            
            
            
        //     const totals = this.noteArrs.map((arr) => {
        //         let sum = 0;
        //         arr.forEach((ele) => {
        //             sum += ele;
        //         });
        //         return sum;
        //     });

        //     // const minTotal = Math.min(...totals);
        //     // const factors = totals.map((n) => {
        //     //     if (minTotal === 0) {
        //     //         return n;
        //     //     }
        //     //     return n / minTotal;
        //     // });

        //     const diffs = midEquals.map((n, i) => {
        //         return (1.0 * n - lastEquals[i]) / n;
        //     });
            
        //     const diffsToUse = diffs.map((n, i) => {
        //         let num = n;
        //         for (let j = 0; j < totals[i]; j++) {
        //             num *= 0.5;
        //         }
        //         return num;
        //     });

        //     let idx = 0;
        //     let max = diffsToUse[0];
        //     diffsToUse.forEach((diff, i) => {
        //         if (diff > max) {
        //             idx = i;
        //             max = diff;
        //         }
        //     });

        //     this.nums[idx] += 1;
        //     if (Math.random() < 0.05) {
        //         console.log(this.nums.map(ele => ele));
        //     }

        //     this.noteArrs.forEach((arr, i) => {
        //         if (i === idx) {
        //             arr.push(0);
        //         } else {
        //             arr.push(1);
        //         }
        //         arr.shift();
        //     });
        //     return [
        //         "slide-left",
        //         "slide-a",
        //         "slide-b",
        //         "slide-right"
        //     ][idx];
        // }
        // END TEMP!!!!

        if (numSlides === 4 && this.recentToneVals.length > 7) {
            const max = Math.max(...this.recentToneVals);
            const min = Math.min(...this.recentToneVals);
            const stepSize = (1.0 * max - min) / 4;
            
            if (toneVal < stepSize + min) {
                return "slide-left";
            }
            if (toneVal < (2 * stepSize) + min) {
                return "slide-a";
            }
            if (toneVal < (3 * stepSize) + min) {
                return "slide-b";
            }
            return "slide-right";
        }

        if (numSlides === 3 && this.recentToneVals.length > 7) {
            const max = Math.max(...this.recentToneVals);
            const min = Math.min(...this.recentToneVals);
            const stepSize = (1.0 * max - min) / 3;
            
            if (toneVal < stepSize + min) {
                return "slide-left";
            }
            if (toneVal < (2 * stepSize) + min) {
                return "slide-a";
            }
            return "slide-right";
        }

        if (numSlides === 2 && this.recentToneVals.length > 7) {
            const max = Math.max(...this.recentToneVals);
            const min = Math.min(...this.recentToneVals);
            const stepSize = (1.0 * max - min) / 2;
            
            if (toneVal < stepSize + min) {
                return "slide-left";
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
        // if (notesPerSecond > 4) {
            gap *= 0.75;
        // }
        // if (notesPerSecond === 2) {
        //     gap *= 1.5;
        // }
        // if (notesPerSecond === 1) {
        //     gap *= 2;
        // }

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

        // if (noteMade) {
            // if (!this.lastValTime || performance.now() - this.lastValTime > (gap - 1)) {
                this.recentToneVals.push(toneVal);
                this.lastValTime = performance.now();
                if (this.recentToneVals.length > this.numToneVals) {
                    this.recentToneVals.shift();
                }
            // }
        // }

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