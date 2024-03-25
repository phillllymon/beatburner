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
    ["button-play", "button-pause", "button-restart"].forEach((id) => {
        addElementClass(id, "disabled-button");
    });
    removeElementClass(buttonId, "disabled-button");
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

export function killAllNotes(masterInfo) {
    masterInfo.notes.forEach((note) => {
        if (note.tail) {
            note.tail.note.remove();
        }
        note.note.remove();
        masterInfo.notes.delete(note);
    });
}