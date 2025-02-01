function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function chooseRandomSetting() {
    globalCurrentSetting = globalFlavorLines[Math.floor(Math.random() * (globalFlavorLines.length-1))];
}

function chooseLine(key) {
    return "<i>"+globalCurrentSetting[key][Math.floor(Math.random() * (globalCurrentSetting[key].length-1))]+"</i>";
}