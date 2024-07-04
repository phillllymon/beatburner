import { thump } from "./thump.js"; // TEMP
import { hideModal, killAllNotes } from "./util.js";

export class Calibrator {
    constructor(masterInfo, animator, noteWriter, addNote) {
        this.masterInfo = masterInfo;
        this.animator = animator;
        this.noteWriter = noteWriter;
        this.addNote = addNote;
        this.menus = [
            "source-menu",
            "main-menu",
            "feedback",
            "choose-song-menu"
        ];
        document.getElementById("close-calibrator-button").addEventListener("click", () => {
            this.endCalibration();
        });
        document.getElementById("faster-button").addEventListener("click", () => {
            this.masterInfo.manualDelay += 1;
            if (this.masterInfo.manualDelay > -1) {
                document.getElementById("manual-delay-display").innerText = `+ ${this.masterInfo.manualDelay} ms`;
            } else {
                document.getElementById("manual-delay-display").innerText = `- ${-1 * this.masterInfo.manualDelay} ms`;
            }
        });
        document.getElementById("slower-button").addEventListener("click", () => {
            this.masterInfo.manualDelay -= 1;
            if (this.masterInfo.manualDelay > -1) {
                document.getElementById("manual-delay-display").innerText = `+ ${this.masterInfo.manualDelay} ms`;
            } else {
                document.getElementById("manual-delay-display").innerText = `- ${-1 * this.masterInfo.manualDelay} ms`;
            }
        });
        document.getElementById("way-faster-button").addEventListener("click", () => {
            this.masterInfo.manualDelay += 25;
            if (this.masterInfo.manualDelay > -1) {
                document.getElementById("manual-delay-display").innerText = `+ ${this.masterInfo.manualDelay} ms`;
            } else {
                document.getElementById("manual-delay-display").innerText = `- ${-1 * this.masterInfo.manualDelay} ms`;
            }
        });
        document.getElementById("way-slower-button").addEventListener("click", () => {
            this.masterInfo.manualDelay -= 25;
            if (this.masterInfo.manualDelay > -1) {
                document.getElementById("manual-delay-display").innerText = `+ ${this.masterInfo.manualDelay} ms`;
            } else {
                document.getElementById("manual-delay-display").innerText = `- ${-1 * this.masterInfo.manualDelay} ms`;
            }
        });

        // popup
        document.getElementById("calibrate-now").addEventListener("click", () => {
            document.getElementById("calibrate-popup").classList.add("hidden");
            this.openCalibration();
        });
        document.getElementById("skip-calibrate").addEventListener("click", () => {
            document.getElementById("calibrate-popup").classList.add("hidden");
        });
        document.getElementById("ok-big-calibrate").addEventListener("click", () => {
            document.getElementById("big-calibrate-popup").classList.add("hidden");
        });

        this.thumpAudio = new Audio();
        // fetch("./effects/thump.txt").then((res) => {
        //     res.text().then((str) => {
        //         this.thumpAudio.setAttribute("src", `data:audio/x-wav;base64,${str}`);
        //     });
        // });

        // TEMP
        this.thumpAudio.setAttribute("src", `data:audio/x-wav;base64,${thump}`);
    }

    openCalibration(songMode, openMenu) { // TODO - return to songMode and openMenu!!!!!
        this.closed = false;
        this.wasSongMode = songMode;
        if (this.masterInfo.manualDelay > -1) {
            document.getElementById("manual-delay-display").innerText = `+ ${this.masterInfo.manualDelay} ms`;
        } else {
            document.getElementById("manual-delay-display").innerText = `- ${-1 * this.masterInfo.manualDelay} ms`;
        }
        hideModal("settings");
        // this.menus.forEach((menuId) => {
        //     document.getElementById(menuId).classList.add("hidden");
        // });
        this.makeMenusInvisible();
        const calibrator = document.getElementById("calibrator");
        calibrator.style.top = "35%";
        calibrator.style.left = "5%";
        calibrator.style.width = "40vw";
        calibrator.classList.remove("hidden");

        this.startCalibration();
    }

    startCalibration() {
        this.masterInfo.songMode = "calibrate";
        this.animator.runAnimation();

        this.addNote("slide-right", 50);
        setTimeout(() => {
            this.thumpAudio.play();
        }, 2000 + this.masterInfo.manualDelay);

        this.calibrationInterval = setInterval(() => {
            this.addNote("slide-right", 50);
            setTimeout(() => {
                if (this.masterInfo.songMode === "calibrate") {
                    this.thumpAudio.play();
                }
            }, 2000 + this.masterInfo.manualDelay);

        }, 2500);

    }

    endCalibration() {
        this.closed = true;
        this.animator.stopAnimation();
        clearInterval(this.calibrationInterval);
        document.getElementById("calibrator").classList.add("hidden");
        // document.getElementById("source-menu").classList.remove("hidden");
        this.makeMenusVisible();
        killAllNotes(this.masterInfo, this.noteWriter);
        setTimeout(() => {
            this.masterInfo.songMode = this.wasSongMode;
        }, 20);
        if (Math.abs(this.masterInfo.manualDelay) > 150) {
            const bigPopup = document.getElementById("big-calibrate-popup");
            bigPopup.style.top = "20%";
            bigPopup.style.left = "10vw";
            bigPopup.style.width = "70vw";
            bigPopup.style.zIndex = "20";
            bigPopup.classList.remove("hidden");

            this.masterInfo.effects = false;
            document.getElementById("toggle-effects-ball").classList.add("toggle-ball-off");
            document.getElementById("effects-title").style.opacity = "0.5";
        }
    }

    makeMenusInvisible() {
        this.menus.forEach((menuId) => {
            document.getElementById(menuId).style.zIndex = "-20";
        });
    }

    makeMenusVisible() {
        this.menus.forEach((menuId) => {
            document.getElementById(menuId).style.zIndex = "5";
        });
    }
}