"use strict";


var container = document.getElementById("container");
var leftPanal, rightPanal;

// well it suggests all possible monosaccharides except for Xxx, however because this variable are used in too many places...
var allPossibleMono = ['GlcNAc', 'Man', 'Gal', 'Fuc', 'NeuAc'];
// monosaccharides which classfied as "others"
var otherMono = ['Glc', 'Xyl', 'GalNAc', 'NeuGc', "Xxx"];
var allMonoOnDisplay = allPossibleMono.concat(["Xxx"]);
var monofreq = {};
var maxComp = {};
var icon_config = {
    'GlcNAc': {"shape": "square", "icon_color": "blue", "count_color": "white"},
    'Man': {"shape": "circle", "icon_color": "green", "count_color": "white"},
    'Gal': {"shape": "circle", "icon_color": "yellow", "count_color": "black"},
    'Fuc': {"shape": "triangle", "icon_color": "red", "count_color": "white"},
    'NeuAc': {"shape": "diamond", "icon_color": "purple", "count_color": "white"},
    'Xxx': {"shape": "circle", "icon_color": "grey", "count_color": "white"}
};

// Deprecated variables
var allPossibleMonoOld = ['Man', 'Gal', 'Glc', 'Xyl', 'Fuc', 'GlcNAc', 'GalNAc', 'NeuAc', 'NeuGc', "Xxx"];
var keyMapPlus = ["q", "w", "e", "r", "t", "y", "u", "i", "o"];
var keyMapMinus = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

// For the viewer in the bottom
var lastClickedTopology = [];

function init() {
    for (var m of allMonoOnDisplay) {
        monofreq[m] = 0;
        maxComp[m] = 1;
    }
}

init();

// runtime variable
var matchedTopologies = [];

function convertXxx() {
    for (var gtcid of Object.keys(data)) {
        var d = data[gtcid];
        if (d.comp) {
            var x = 0;
            for (var i of otherMono) {
                if (d.comp[i]) {
                    x += d.comp[i];
                }
            }
            d.comp["Xxx"] = x;
        }
    }
}

convertXxx();

function allocateDiv() {
    leftPanal = document.createElement("div");
    rightPanal = document.createElement("div");

    //leftPanal.style = "float: left; border-color: lightgrey; border-style: solid; width: 65px; margin: 0px; padding: 0px;";
    //rightPanal.style = "float: left; border-color: lightgrey; border-style: solid;";
    leftPanal.style = "float: left; width: 65px; margin: 0px; padding: 0px;";
    container.style = "border-color: lightgrey; border-style: solid;";

    container.appendChild(leftPanal);
    container.appendChild(rightPanal);

}

function resizeContainer() {
    var width = leftPanal.clientWidth + rightPanal.clientWidth;
    var height = Math.max(leftPanal.clientHeight, rightPanal.clientHeight);

    container.style.height = height + 5 + "px";
    container.style.width = width + 15 + "px";
}

allocateDiv();

function compositionChange(iupac, num) {
    var c = monofreq[iupac];

    if (num < 0 && c + num < 0) {
        // ignore minus count
    } else if (num > 0 && maxComp[iupac] - monofreq[iupac] === 0) {
        // exceed maximum possible configuration

    } else {
        monofreq[iupac] = monofreq[iupac] + num;
        afterChange();
        refreshLeftPanal();
    }
}

function drawMonoIcon(m) {
    var icon = document.createElement("canvas");
    icon.setAttribute("width", "20px");
    icon.setAttribute("height", "20px");

    var config = icon_config[m];

    var ctx = icon.getContext("2d");
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = config.icon_color;
    ctx.font = "12px Arial";

    if (config.shape == "square") {
        ctx.moveTo(2, 2);
        ctx.lineTo(2, 18);
        ctx.lineTo(18, 18);
        ctx.lineTo(18, 2);
    } else if (config.shape == "circle") {
        ctx.arc(10, 10, 9, 0, 2 * Math.PI);
    } else if (config.shape == "triangle") {
        ctx.moveTo(10, 1);
        ctx.lineTo(1, 19);
        ctx.lineTo(19, 19);
    } else if (config.shape == "diamond") {
        ctx.moveTo(10, 1);
        ctx.lineTo(19, 10);
        ctx.lineTo(10, 19);
        ctx.lineTo(1, 10);
    } else {
        console.log("shape is not supported yet")
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = config.count_color;
    var t = monofreq[m].toString();
    var x, y = 14.3;
    if (t.length == 1) {
        x = 6.8;
    } else {
        x = 3.3
    }
    if (config.shape == "triangle") {
        y = y + 4;
    }

    ctx.fillText(t, x, y);

    return icon
}

function drawAddAndSubButton(add, grey) {
    var button = document.createElement("canvas");
    var color = "DodgerBlue";
    button.setAttribute("width", "20px");
    button.setAttribute("height", "20px");
    var ctx = button.getContext('2d');
    ctx.beginPath();
    if (add) {
        ctx.moveTo(1, 1);
        ctx.lineTo(19, 10);
        ctx.lineTo(1, 19);
        color = "SlateBlue";
    } else {
        ctx.moveTo(1, 10);
        ctx.lineTo(19, 19);
        ctx.lineTo(19, 1);
    }
    ctx.closePath();
    ctx.lineWidth = 2;
    if (grey) {
        color = "lightgrey";
    }
    ctx.fillStyle = color;
    ctx.fill();

    return button
}


function appendicons(iupacComp) {
    var icons_container = document.createElement("div");

    var icon = drawMonoIcon(iupacComp);

    var ind = allMonoOnDisplay.indexOf(iupacComp);

    var g = true;
    if (monofreq[iupacComp] > 0) {
        g = false
    }
    var subbutton = drawAddAndSubButton(false, g);
    subbutton.onclick = function () {
        compositionChange(iupacComp, -1);
    };

    if (maxComp[iupacComp] - monofreq[iupacComp] > 0) {
        g = false
    } else {
        g = true
    }
    var addbutton = drawAddAndSubButton(true, g);
    addbutton.onclick = function () {
        compositionChange(iupacComp, 1);
    };

    leftPanal.appendChild(subbutton);
    leftPanal.appendChild(icon);
    leftPanal.appendChild(addbutton);
    leftPanal.appendChild(document.createElement("br"));

}

function refreshLeftPanal() {
    leftPanal.innerHTML = "";
    for (var iupacComp of allMonoOnDisplay) {
        appendicons(iupacComp)
    }
}

refreshLeftPanal();

function getCurrentComp() {
    return monofreq
}

function afterChange() {


    var currentComp = getCurrentComp();

    for (var k of Object.keys(currentComp)) {
        maxComp[k] = 0;
    }

    matchedTopologies = [];

    for (var gtcid of Object.keys(data)) {
        var d = data[gtcid];
        if (d.comp) {
            var flag = true;
            for (var mc of Object.keys(currentComp)) {
                if (currentComp[mc] != d.comp[mc]) {
                    flag = false;
                }
            }
            if (flag) {
                matchedTopologies.push(gtcid);
            }
        }
    }

    for (var gtcid of Object.keys(data)) {
        var d = data[gtcid];
        if (d.comp) {
            var flag = true;
            for (var mc of Object.keys(currentComp)) {
                if (currentComp[mc] > d.comp[mc]) {
                    flag = false;
                }
            }
            if (flag) {
                for (var mc of Object.keys(currentComp)) {
                    if (!d.comp[mc]) {
                        continue
                    }
                    maxComp[mc] = Math.max(maxComp[mc], d.comp[mc]);
                }
            }
        }
    }

    updateRightPannal();
}

function getImage(gtcid) {
    var figure = document.createElement("figure");
    figure.style.margin = 0;
    figure.id = "img_" + gtcid;
    var img = document.createElement("img");
    img.src = "https://edwardslab.bmcb.georgetown.edu/~wzhang/web/glycan_images/cfg/extended/" + gtcid + ".png";
    img.style = "width: 100px; height: auto;";
    img.gtcid = gtcid;
    img.onclick = function () {
        v(gtcid);
    };
    img.onload = function () {
        resizeContainer();
    };
    var caption = document.createElement("figcaption");
    caption.innerText = gtcid;
    caption.style.textAlign = "center";

    figure.appendChild(img);
    figure.appendChild(caption);

    return figure
}

function updateRightPannal() {
    var colnum = parseInt((window.innerWidth - 160) / 104);
    if (colnum == 0) {
        colnum == 1
    }

    rightPanal.innerHTML = "";

    var table = document.createElement("table");
    var row = document.createElement("tr");
    var c = 0;
    matchedTopologies.sort(function (id1, id2) {
        var x = Object.keys(data[id2].content.nodes).length - Object.keys(data[id1].content.nodes).length;
        return x
    });

    for (var gtcid of matchedTopologies) {
        var f = getImage(gtcid);
        var td = document.createElement("td");

        td.appendChild(f);
        c++;
        if (c % colnum != 0) {
            row.appendChild(td);
        } else {
            row.appendChild(td);
            table.appendChild(row);
            row = document.createElement("tr");
        }

    }
    if (c % colnum != 0) {
        table.appendChild(row);
    }
    rightPanal.appendChild(table);

    resizeContainer();
}

function keyPress() {
    var d = document.getElementsByTagName("body")[0];
    d.onkeypress = function (e) {
        if ("qwerty".includes(e.key)) {
            var m = allMonoOnDisplay[keyMapPlus.indexOf(e.key)];
            compositionChange(m, 1)
        }
        if (e.shiftKey) {
            if ("qwertyQWERTY".includes(e.key)) {
                var m = allMonoOnDisplay[keyMapPlus.indexOf(e.key.toLowerCase())];
                compositionChange(m, -1)
            }
        }
    }
}

keyPress();
