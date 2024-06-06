export function animateSparks(tapperId) {
    const newSpark = document.createElement("div");
    newSpark.classList.add("spark");
    document.getElementById(tapperId).appendChild(newSpark);
    newSpark.style.left = "35%";
    newSpark.style.top = "35%";
}