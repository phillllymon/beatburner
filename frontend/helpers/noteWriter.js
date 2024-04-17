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

        this.numToneVals = 40;
        this.recentToneVals = [50];
        // this.recentToneVals = [20, 50, 80];
        // this.recentToneVals = [20, 20, 20, 50, 50, 80, 80, 80];
        // this.recentToneVals = [20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80];
        // this.recentToneVals = [
        //     20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80,
        //     20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80,
        //     20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80,
        //     20, 20, 20, 50, 50, 80, 80, 80, 20, 20, 20, 50, 50, 80, 80, 80
        // ];


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
        this.peakOffset = 0;

        // precise better - same but with running total
        this.prev = false;
        this.low = false;
        this.lowIdx = false;
        this.dir = 1;
    
        

        // which algorithm?
        // this.doPrecise = true;
        this.doPreciseBetter = true;
    }

    writeTails(theseTallestTowers, slideIds, futureTallestTowers) {
        if (this.recentToneVals.length < 16) {
            return;
        }

        slideIds.forEach((slideId) => {

            
            const lastNote = this.mostRecentNotes[slideId];
            if (lastNote) {

                let yesToTail = false;

                const theseTowerLocations = new Set();
                theseTallestTowers.forEach((tower) => {
                    theseTowerLocations.add(tower[1]);
                });
                let towersFound = 0;
                const towersNeeded = Math.ceil(lastNote.val.length / 6);
                lastNote.val.forEach((tower) => {
                    const loc = tower[1];
                    let towerFound = false;
                    [loc - 2, loc - 1, loc, loc + 1, loc + 2].forEach((closeNum) => {
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
                        lastNote.val.forEach((tower) => {
                            const loc = tower[1];
                            let towerFound = false;
                            [loc - 4, loc - 3, loc - 2, loc - 1, loc, loc + 1, loc + 2, loc + 3, loc + 4].forEach((closeNum) => {
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

                if (towersFound >= towersNeeded && futurePass) {
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
            const timeArrToUse = timeArray;
            this.timeArrayVariances.push(Math.max(...timeArrToUse) - Math.min(...timeArrToUse));
            
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
                const hillPeakIdxs = {}; // filled with idx: peakIdx
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
                                hills.push([hillHeight, timeLowIdx]); // i - idx is to get toneVal from peak
                                hillPeakIdxs[timeLowIdx] = i - timeLowIdx;
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
                toneValToUse = this.toneVals[peakIdx];

                
                const timePerStep = 4000 / this.tallestTowers.length;
                let numFutureSteps = Math.ceil(200 / timePerStep);

                if (this.masterInfo.sustainedNotes) {
                    this.writeTails(
                        this.tallestTowers[midIdx + this.peakOffset],
                        slideIds, 
                        this.tallestTowers.slice(midIdx + this.peakOffset + 1, midIdx + this.peakOffset + 1 + numFutureSteps)
                    );
                } 
                
                if (this.timeArrayVariances[realMidIdx] < 15) {
                    return;
                }

                const maxV = Math.max(...this.aveHillHeights);
                const minV = Math.min(...this.aveHillHeights);
                const midV = (1.0 * maxV + minV) / 2;
                const range = maxV - minV;
                const v = this.aveHillHeights[this.aveHillHeights.length - 1];
                const fraction = 1.0 * (v - minV) / range;
                
                // const backgroundArr = [
                //     100,
                //     100,
                //     100,
                //     100
                // ];

                
                

                this.backgroundAnimator.animateBackground([
                    arrAverage(this.timeArrayVariances.slice(this.timeArrayVariances.length - 16, this.timeArrayVariances.length - 6)),
                    arrAverage(this.timeArrayVariances.slice(this.timeArrayVariances.length - 14, this.timeArrayVariances.length - 4)),
                    arrAverage(this.timeArrayVariances.slice(this.timeArrayVariances.length - 12, this.timeArrayVariances.length - 2)),
                    arrAverage(this.timeArrayVariances.slice(this.timeArrayVariances.length - 10, this.timeArrayVariances.length - 0))
                ]);
                
                // console.log(3 - (6 * fraction));
                
                const cutoff = {
                    1: 0.85,
                    2: 0.5,
                    3: 0.3,
                    4: 0,
                    5: 0
                }[notesPerSecond];
                if (hills.slice(Math.floor(cutoff * hills.length), hills.length - 1).map((hill) => {
                    return hill[1];
                }).includes(midIdx)) {
                    makeNote = true;
                }
            }

            // precise better
            if (this.doPreciseBetter) {
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
                    return peak[0];
                }))); // put latest average peak height into this.aveHillHeights
                
                if (this.aveHillHeights.length > this.times.length) {
                    this.aveHillHeights.shift();
                    this.timeArrayVariances.shift();
                    this.tallestTowers.shift();
                    this.toneVals.shift();
                }

                // now look for time hills to trigger notes
                const maxHills = 100;
                const hills = [];
                const hillPeakIdxs = {}; // filled with idx: peakIdx
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
                            // if (hills.length === 0 || hillHeight > hills[0][0]) {
                            if (hillHeight > 0) {
                                
                                // fast push & sort
                                

                                // slow push & sort
                                hills.push([hillHeight, timeLowIdx]); // i - idx is to get toneVal from peak
                                hillPeakIdxs[timeLowIdx] = i - timeLowIdx;
                                // hills.sort((a, b) => {
                                //     if (a[0] > b[0]) {
                                //         return 1;
                                //     } else {
                                //         return -1;
                                //     }
                                // });
                                
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
                // console.log(hills.map(ele => ele.map(el => el)));

                // SORT HILLS JUST ONCE, after they're all gathered
                hills.sort((a, b) => {
                    if (a[0] > b[0]) {
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
                toneValToUse = this.toneVals[peakIdx];

                
                const timePerStep = 4000 / this.tallestTowers.length;
                let numFutureSteps = Math.ceil(200 / timePerStep);

                if (this.masterInfo.sustainedNotes) {
                    this.writeTails(
                        this.tallestTowers[midIdx + this.peakOffset],
                        slideIds, 
                        this.tallestTowers.slice(midIdx + this.peakOffset + 1, midIdx + this.peakOffset + 1 + numFutureSteps)
                    );
                } 
                
                if (this.timeArrayVariances[realMidIdx] < 15) {
                    return;
                }

                const maxV = Math.max(...this.aveHillHeights);
                const minV = Math.min(...this.aveHillHeights);
                const midV = (1.0 * maxV + minV) / 2;
                const range = maxV - minV;
                const v = this.aveHillHeights[this.aveHillHeights.length - 1];
                const fraction = 1.0 * (v - minV) / range;
                
                const cutoff = {
                    1: 0.95,
                    2: 0.75,
                    3: 0.5,
                    4: 0,
                    5: 0
                }[notesPerSecond];
                if (hills.slice(Math.floor(cutoff * hills.length), hills.length - 1).map((hill) => {
                    return hill[1];
                }).includes(midIdx)) {
                    makeNote = true;
                }

                // this.backgroundAnimator.animateBackground([
                //     arrAverage(this.timeArrayVariances.slice(this.timeArrayVariances.length - 16, this.timeArrayVariances.length - 6)),
                //     arrAverage(this.timeArrayVariances.slice(this.timeArrayVariances.length - 14, this.timeArrayVariances.length - 4)),
                //     arrAverage(this.timeArrayVariances.slice(this.timeArrayVariances.length - 12, this.timeArrayVariances.length - 2)),
                //     arrAverage(this.timeArrayVariances.slice(this.timeArrayVariances.length - 10, this.timeArrayVariances.length - 0))
                // ]);

                // this.lastAlls.push({
                //     "slide-left": (now - this.lastAll["slide-left"]),
                //     "slide-a": (now - this.lastAll["slide-a"]),
                //     "slide-b": (now - this.lastAll["slide-b"]),
                //     "slide-right": (now - this.lastAll["slide-right"])
                // });
                // if (this.lastAlls.length > this.times.length) {
                //     this.lastAlls.shift();
                // }

                // if (this.lastAlls.length > 20) {
                //     this.backgroundAnimator.animateBackground([
                //         arrAverage(this.lastAlls.slice(Math.floor(0.99 * this.lastAlls.length - 1), this.lastAlls.length - 1).map(ele => ele["slide-left"])),
                //         arrAverage(this.lastAlls.slice(Math.floor(0.99 * this.lastAlls.length - 1), this.lastAlls.length - 1).map(ele => ele["slide-a"])),
                //         arrAverage(this.lastAlls.slice(Math.floor(0.99 * this.lastAlls.length - 1), this.lastAlls.length - 1).map(ele => ele["slide-b"])),
                //         arrAverage(this.lastAlls.slice(Math.floor(0.99 * this.lastAlls.length - 1), this.lastAlls.length - 1).map(ele => ele["slide-right"]))
                //     ]);
                // }

                this.lastAlls.push({
                    "slide-left": (now - this.lastAll["slide-left"]),
                    "slide-a": (now - this.lastAll["slide-a"]),
                    "slide-b": (now - this.lastAll["slide-b"]),
                    "slide-right": (now - this.lastAll["slide-right"])
                });
                if (this.lastAlls.length > this.times.length) {
                    this.lastAlls.shift();
                }

                if (this.lastAlls.length > 20) {
                    this.backgroundAnimator.animateBackground([
                        Math.pow(arrAverage(arrToUse.slice(arrToUse.length - 2048, arrToUse.length - 1536)), 1.5),
                        Math.pow(arrAverage(arrToUse.slice(arrToUse.length - 1536, arrToUse.length - 1024)), 1.5),
                        Math.pow(arrAverage(arrToUse.slice(arrToUse.length - 1024, arrToUse.length - 512)), 1.5),
                        Math.pow(arrAverage(arrToUse.slice(arrToUse.length - 512, arrToUse.length - 256)), 1.5)
                    ]);
                }
                
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
            
            if (i < this.recentToneVals.length / 4) {
                return "slide-left";
            }
            if (i < this.recentToneVals.length / 2) {
                return "slide-a";
            }
            if (i < 3 * this.recentToneVals.length / 4) {
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