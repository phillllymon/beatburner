import { 
    setButtonClick,
    showModal,
    hideModal,
    showSongControlButton,
    killAllNotes
} from "./util.js";
import { songData } from "../data.js";

export class MenuManager {
    constructor(masterInfo, controlsManager, player, stationManager, streamPlayer, noteWriter) {
        this.masterInfo = masterInfo;
        this.controlsManager = controlsManager;
        this.stationManager = stationManager;
        this.player = player;
        this.streamPlayer = streamPlayer;
        this.noteWriter = noteWriter;
        this.menus = [
            "source-menu",
            "main-menu",
            "feedback",
            "choose-song-menu"
        ];
        this.mainMenuOptions = [
            "choose-song-button",
            "upload-song-button",
            "select-station-button",
            "show-stream-modal-button"
        ];

        this.activateMenuShowButtons();
        this.activateSourceMenuButtons();

        this.activateMainMenu();
        this.activateFeedbackMenu();
        this.activateGiveFeedbackMenu();

        this.activateControlsDrag();

        this.hideMenus();
        // this.showMenu("choose-song-menu");
    }

    activateControlsDrag() {
        const controlsMenu = document.getElementById("controls-bottom");
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;
        const totalWidth = window.innerWidth;
        const totalHeight = window.innerHeight;
        let dragTimeout;
        controlsMenu.addEventListener("touchstart", (e) => {
            dragTimeout = setTimeout(() => {
                dragging = true;
                const rect = controlsMenu.getBoundingClientRect();
                offsetX = e.targetTouches[0].clientX - rect.left;
                offsetY = e.targetTouches[0].clientY - rect.top;
                controlsMenu.style.opacity = "1";
            }, 500);
        });
        controlsMenu.addEventListener("touchend", () => {
            dragging = false;
            clearTimeout(dragTimeout);
            controlsMenu.style.opacity = "0.5";
        });
        document.addEventListener("touchmove", (e) => {
            if (dragging) {
                controlsMenu.classList.remove("stuck-to-bottom");
                let newX = e.changedTouches[0].clientX - offsetX;
                let newY = e.changedTouches[0].clientY - offsetY;
                const newRect = controlsMenu.getBoundingClientRect();
                if (newX < 0) {
                    newX = 0;
                }
                if (newX > totalWidth - (newRect.right - newRect.left)) {
                    newX = totalWidth - (newRect.right - newRect.left);
                }
                if (newY < 0) {
                    newY = 0;
                }
                if (newY > totalHeight - (newRect.bottom - newRect.top)) {
                    newY = totalHeight - (newRect.bottom - newRect.top);
                }
                controlsMenu.style.top = `${newY}px`;
                controlsMenu.style.left = `${newX}px`;
                if (e.changedTouches[0].clientX < 0.15 * totalWidth || e.changedTouches[0].clientX > 0.85 * totalWidth) {
                    controlsMenu.classList.add("controls-vertical");
                }
                if (e.changedTouches[0].clientY > 0.85 * totalHeight) {
                    controlsMenu.classList.remove("controls-vertical");
                }
            }
        });
    }

    activateGiveFeedbackMenu() {
        setButtonClick("open-feedback-link", () => {
            document.userFeedbackOpen = true;
            document.getElementById("give-feedback-modal").classList.remove("hidden");
            document.getElementById("give-feedback-modal").classList.add("menu");
            document.getElementById("modal-background").classList.remove("hidden");
            document.getElementById("settings-modal").classList.add("hidden");
        });
        setButtonClick("cancel-give-feedback", () => {
            document.getElementById("give-feedback-modal").classList.add("hidden");
            document.getElementById("give-feedback-modal").classList.remove("menu");
            document.getElementById("modal-background").classList.add("hidden");
            document.getElementById("settings-modal").classList.remove("hidden");

            document.userFeedbackOpen = false;
        });
        setButtonClick("submit-give-feedback", () => {
            const message = document.getElementById("feedback-message").value;
            if (message.length < 3) {
                alert("Cannot submit empty message!");
            } else {
                document.getElementById("cancel-give-feedback").disabled = "disabled";
                document.getElementById("submit-give-feedback").disabled = "disabled";
                let email = document.getElementById("feedback-email").value;
                if (email.length < 1) {
                    email = "none";
                }
                fetch("https://beatburner.com/api/feedback.php", {
                    method: "POST",
                    body: JSON.stringify({
                        message: message,
                        email: email
                    })
                }).then(() => {
                    document.getElementById("give-feedback-modal").innerHTML = "Thanks!";
                    setTimeout(() => {
                        document.getElementById("give-feedback-modal").classList.add("hidden");
                        document.getElementById("give-feedback-modal").classList.remove("menu");
                        document.getElementById("settings-modal").classList.remove("hidden");
                        document.userFeedbackOpen = false;
                    }, 1000);


                });
            }
        });
    }

    activateFeedbackMenu() {
        setButtonClick("replay", () => {
            this.player.restart();
            this.controlsManager.playFunction();
            this.hideMenus();
        });
        document.getElementById("no-replay").addEventListener("click", () => {
        // setButtonClick("no-replay", () => {
            if (this.masterInfo.songMode === "demo") {
                this.showMenu("choose-song-menu");
            } else {
                this.showMenu("main-menu");
            }
        });
    }

    activateMainMenu() {
        document.getElementById("choose-song-button").addEventListener("click", () => {
        // setButtonClick("choose-song-button", () => {
            document.getElementById("choose-song-menu").classList.remove("hidden");
            document.getElementById("main-menu").classList.add("hidden");
        });
        setButtonClick("close-and-play", () => {
            this.hideMenus();
            if (this.masterInfo.songMode === "radio") {
                this.stationManager.startListening();
            } else {
                this.controlsManager.playFunction();
            }
        });
    }

    activateSourceMenuButtons() {
        setButtonClick("source-demo-songs", () => {
            this.masterInfo.canEnterCode = false;
            this.masterInfo.songMode = "demo";
            this.setMainMenuOption("choose-song-button");
            if (!this.masterInfo.audioLoaded) {
                document.getElementById("close-and-play").classList.add("hidden");
                document.getElementById("close-and-play-ghost").classList.remove("hidden");
                this.player.setPlayerReady(() => {
                    document.getElementById("close-and-play").classList.remove("hidden");
                    document.getElementById("close-and-play-ghost").classList.add("hidden");
                    this.masterInfo.audioLoaded = true;
                    this.player.setPlayerReady(() => {});
                });
                if (this.masterInfo.defaultSong) {
                    fetch(`./songStrings/${this.masterInfo.defaultSong}.txt`).then((res) => {
                        res.text().then((str) => {
                            this.masterInfo.currentSong = songData[this.masterInfo.defaultSong];
                            this.player.pause();
                            this.player.setSource(`data:audio/x-wav;base64,${str}`);
                            showSongControlButton("button-play");
                            document.getElementById("song-label").innerText = this.masterInfo.currentSong;
                            killAllNotes(this.masterInfo, this.noteWriter);
                            this.masterInfo.defaultSong = null;
                        });
                    });
                } else {
                    if (this.masterInfo.currentSong) {
                        this.masterInfo.currentSong = songData[this.masterInfo.songCode];
                    }
                }
            }
            this.showMenu("main-menu");
            if (this.masterInfo.songMode === "radio") {
                this.stationManager.stopListening();
            }
        });
        setButtonClick("source-upload", () => {
            this.masterInfo.canEnterCode = false;
            this.masterInfo.songMode = "upload";
            this.setMainMenuOption("upload-song-button");

            if (!this.masterInfo.audioLoaded) {
                document.getElementById("close-and-play").classList.add("hidden");
                document.getElementById("close-and-play-ghost").classList.add("hidden");
                this.player.setPlayerReady(() => {
                    document.getElementById("close-and-play").classList.remove("hidden");
                    document.getElementById("close-and-play-ghost").classList.add("hidden");
                    this.masterInfo.audioLoaded = true;
                    this.player.setPlayerReady(() => {});
                });
            }

            this.showMenu("main-menu");
            if (this.masterInfo.songMode === "radio") {
                this.stationManager.stopListening();
            }
        });
        setButtonClick("source-radio", () => {
            this.masterInfo.canEnterCode = false;
            document.getElementById("close-and-play-ghost").classList.add("hidden");
            this.masterInfo.songMode = "radio";
            this.setMainMenuOption("select-station-button");
            this.showMenu("main-menu");
            this.masterInfo.currentSong = "Hawk classic rock";
            document.getElementById("close-and-play").classList.remove("hidden");
        });
        document.getElementById("source-streaming").addEventListener("click", () => {
            this.masterInfo.canEnterCode = false;
            document.getElementById("close-and-play-ghost").classList.add("hidden");
            this.masterInfo.songMode = "stream";
            this.setMainMenuOption("show-stream-modal-button");
            // this.showMenu("main-menu");
            // showModal("stream");
            document.getElementById("source-menu").classList.add("hidden");
            document.getElementById("stream-modal").classList.remove("hidden");
            if (this.masterInfo.songMode === "radio") {
                this.stationManager.stopListening();
            }
        });

        // putting this here just because
        setButtonClick("show-stream-modal-button", () => {
            // showModal("stream");
            document.getElementById("main-menu").classList.add("hidden");
            document.getElementById("stream-modal").classList.remove("hidden");
        });
    }

    setMainMenuOption(optionId) {
        this.mainMenuOptions.forEach((optId) => {
            document.getElementById(optId).classList.add("hidden");
        });
        document.getElementById(optionId).classList.remove("hidden");
    }

    activateMenuShowButtons() {
        document.getElementById("show-menu").addEventListener("click", () => {
            if (this.masterInfo.songMode && this.masterInfo.songMode !== "tutorial") {
                this.showMenu("main-menu");
                this.player.pause();
                this.streamPlayer.stop();
                this.player.countdownCanceled = true;
            }
        });
        document.getElementById("show-source-menu").addEventListener("click", () => {
            this.masterInfo.canEnterCode = true;
            killAllNotes(this.masterInfo, this.noteWriter);
            document.getElementById("song-label").innerHTML = "";
            this.masterInfo.currentSong = "";
            this.showMenu("source-menu");
            this.player.pause();
            this.streamPlayer.stop();
            this.stationManager.stopListening();
        });
        document.getElementById("back-to-main-menu").addEventListener("click", () => {
            this.showMenu("main-menu");
        });
    }

    showMenu(menuId) {
        this.hideMenus();
        document.getElementById(menuId).classList.remove("hidden");
    }

    hideMenus() {
        this.menus.forEach((menuId) => {
            document.getElementById(menuId).classList.add("hidden");
        });
    }


    
}