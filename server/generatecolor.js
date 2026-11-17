const getRandomHexColor = () => {
    // lots of code repeated thrice, abstract some of this into functions
    
    let R = Math.floor(Math.random() * 0xFF);
    let G = Math.floor(Math.random() * 0xFF);
    let B = Math.floor(Math.random() * 0xFF);
    if (R < 0x10){
        R = `0${R}`;
    }
    if (G < 0x10){
        G = `0${G}`;
    }
    if (B < 0x10){
        B = `0${B}`;
    }
    console.log(`\x1b[38;2;${R};${G};${B}mhello\x1b[0m`);
    return `#${R.toString(16)}${G.toString(16)}${B.toString(16)}`;
}

module.exports = {
    getRandomHexColor
}
//console.log(getRandomHexColor());