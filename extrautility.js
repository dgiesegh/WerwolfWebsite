/*
This script contains extra utility functions mostly related to random choosing.
*/

/*
Randomly shuffles given array in place.
*/
function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/*
Randomly selects a setting from globalFlavorLines.
*/
function chooseRandomSetting() {
    globalCurrentSetting = globalFlavorLines[Math.floor(Math.random() * (globalFlavorLines.length-1))];
}

/*
Randomly chooses a line from the current setting given the line key. Replaces XY with name.
*/
function chooseLine(key, name="<dummy>") {
    let line = globalCurrentSetting[key][Math.floor(Math.random() * (globalCurrentSetting[key].length-1))];
    return ("<i>"+line+"</i>").replaceAll("XY", name);
}