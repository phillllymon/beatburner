export function averageOf(arr) {
    let sum = 0;
    arr.forEach((val) => {
        sum += val;
    });
    return sum / arr.length;
}

export function setButtonClick(buttonId, callback) {
    if (detectMobile()) {
        document.getElementById(buttonId).addEventListener("touchstart", callback);
    } else {
        document.getElementById(buttonId).addEventListener("click", callback);
    }
}

export function setElementText(elementId, text) {
    document.getElementById(elementId).innerText = text;
}

export function addElementClass(elementId, newClass) {
    document.getElementById(elementId).classList.add(newClass);
}

export function removeElementClass(elementId, newClass) {
    document.getElementById(elementId).classList.remove(newClass);
}

export function detectMobile() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.mobile;
    } else {
        // got this from https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
        const toMatch = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i
        ];
        
        return toMatch.some((toMatchItem) => {
            return navigator.userAgent.match(toMatchItem);
        }); 
    }
}

export function showSongControlButton(buttonId) {
    ["button-play", "button-pause"].forEach((id) => {
        addElementClass(id, "hidden");
    });
    removeElementClass(buttonId, "hidden");
}

export function showModal(modal) {
    const modalId = `${modal}-modal`;
    document.getElementById(modalId).classList.remove("hidden");
    document.getElementById("modal-background").classList.remove("hidden");
}
export function hideModal(modal) {
    const modalId = `${modal}-modal`;
    document.getElementById(modalId).classList.add("hidden");
    document.getElementById("modal-background").classList.add("hidden");
}

export function setLoading(message = "loading...") {
    document.getElementById("loading-text").innerHTML = message;
    document.getElementById("loading").classList.remove("hidden");
    setLoadingPercent(0);
}

export function stopLoading() {
    document.getElementById("loading").classList.add("hidden");
}

export function setLoadingPercent(percent) {
    document.getElementById("loading-bar-inner").style.width = `${percent}%`;
}

export function setLoadingMessage(message) {
    document.getElementById("loading-text").innerHTML = message;
}

export function killAllNotes(masterInfo) {
    masterInfo.notes.forEach((note) => {
        if (note.tail) {
            note.tail.note.remove();
        }
        note.note.remove();
        masterInfo.notes.delete(note);
    });
}