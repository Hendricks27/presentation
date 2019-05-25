"use strict";


var container = document.getElementById("container");
var leftPanal, rightPanal, hintForShortcut;

// well it suggests all possible monosaccharides except for Xxx, however because this variable are used in too many places...
var allPossibleMono = ['GlcNAc', 'Man', 'Gal', 'Fuc', 'NeuAc'];
// monosaccharides which classfied as "others"
var otherMono = ['Glc', 'Xyl', 'GalNAc', 'NeuGc', "Xxx"];
var allMonoOnDisplay = allPossibleMono.concat(["Xxx"]);
var monofreq = {};
var maxComp = {};
var icon_config = {
    'GlcNAc': {"shape": "square", "icon_color": "rgb(17,0,250)", "count_color": "white"},
    'Man': {"shape": "circle", "icon_color": "rgb(0,200,50)", "count_color": "white"},
    'Gal': {"shape": "circle", "icon_color": "rgb(254,255,0)", "count_color": "black"},
    'Fuc': {"shape": "triangle", "icon_color": "rgb(250,0,0)", "count_color": "white"},
    'NeuAc': {"shape": "diamond", "icon_color": "rgb(200,0,200)", "count_color": "white"},
    'Xxx': {"shape": "circle", "icon_color": "grey", "count_color": "white"}
};

// Deprecated variables
var allPossibleMonoOld = ['Man', 'Gal', 'Glc', 'Xyl', 'Fuc', 'GlcNAc', 'GalNAc', 'NeuAc', 'NeuGc', "Xxx"];
var keyMap = "nmgfsx";

// For the viewer in the bottom
var lastClickedTopology = [];

function allocateDiv() {
    leftPanal = document.createElement("div");
    rightPanal = document.createElement("div");
    hintForShortcut = document.createElement("div");

    //leftPanal.style = "float: left; border-color: lightgrey; border-style: solid; width: 65px; margin: 0px; padding: 0px;";
    //rightPanal.style = "float: left; border-color: lightgrey; border-style: solid;";
    leftPanal.style = "float: left; width: 130px; margin: 0px; padding: 0px;";
    container.style = "border-color: lightgrey; border-style: solid;";
    hintForShortcut.style = "display: none";

    container.appendChild(leftPanal);
    container.appendChild(rightPanal);
    container.appendChild(hintForShortcut);

}
allocateDiv();

function init() {
    for (var m of allMonoOnDisplay) {
        monofreq[m] = 0;
        maxComp[m] = 1;
    }
    // use this function to load parametersm
    var urlobj = new URL(window.location);
    var params = {};
    for (var p of urlobj.searchParams){
        params[p[0]] = p[1];
    }
    if (Object.keys(params).includes("saccharide")){
        for (var t of Object.keys(data)){
            if (Object.keys(data[t].content.nodes).includes(params["saccharide"])){
                break
            }
        }

        monofreq = {};
        for (var ttt of allPossibleMono){
            monofreq[ttt] = data[t].comp[ttt];
        }
        var tttt = 0;
        for (var ttttt of otherMono){
            tttt += data[t].comp[ttttt];
        }
        monofreq["Xxx"] = tttt;
        afterChange();

        v(t, params["saccharide"]);
    }
    else if (Object.keys(params).includes("topology")){

        monofreq = {};
        for (var ttt of allPossibleMono){
            monofreq[ttt] = data[params.topology].comp[ttt];
        }
        var tttt = 0;
        for (var ttttt of otherMono){
            tttt += data[params.topology].comp[ttttt];
        }
        monofreq["Xxx"] = tttt;
        afterChange();

        v(params.topology);

    }
    else{
        for (var ttt of allMonoOnDisplay) {
            if (Object.keys(params).includes(ttt)) {
                monofreq[ttt] = parseInt(params[ttt]);
            }
        }
        for (var tttt of Object.values(monofreq)){
            if (tttt != 0){
                afterChange();
                break;
            }
        }

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



function resizeContainer() {
    var width = leftPanal.clientWidth + document.getElementsByTagName("table")[0].clientWidth;
    var height = Math.max(leftPanal.clientHeight, rightPanal.clientHeight);

    container.style.height = height + 5 + "px";
    container.style.width = width + 15 + "px";
}


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
    icon.setAttribute("width", "40px");
    icon.setAttribute("height", "40px");

    var config = icon_config[m];

    var ctx = icon.getContext("2d");
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = config.icon_color;
    ctx.font = "26px Arial";

    if (config.shape == "square") {
        ctx.moveTo(2, 2);
        ctx.lineTo(2, 38);
        ctx.lineTo(38, 38);
        ctx.lineTo(38, 2);
    } else if (config.shape == "circle") {
        ctx.arc(20, 20, 19, 0, 2 * Math.PI);
    } else if (config.shape == "triangle") {
        ctx.moveTo(20, 39);
        ctx.lineTo(1, 1);
        ctx.lineTo(39, 1);
    } else if (config.shape == "diamond") {
        ctx.moveTo(20, 1);
        ctx.lineTo(39, 20);
        ctx.lineTo(20, 39);
        ctx.lineTo(1, 20);
    } else {
        console.log("shape is not supported yet")
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = config.count_color;
    var t = monofreq[m].toString();
    var x, y = 30;
    if (t.length == 1) {
        x = 13;
    } else {
        x = 5;
    }
    if (config.shape == "triangle") {
        y = y - 9;
        if (t.length == 1){
            y+=3;
        }
    }

    ctx.fillText(t, x, y);

    return icon
}

function drawAddAndSubButtonOld(add, grey) {
    var button = document.createElement("canvas");
    var color = "DodgerBlue";
    button.setAttribute("width", "40px");
    button.setAttribute("height", "40px");
    var ctx = button.getContext('2d');
    ctx.beginPath();
    if (add) {
        ctx.moveTo(1, 1);
        ctx.lineTo(39, 20);
        ctx.lineTo(1, 39);
        color = "SlateBlue";
    } else {
        ctx.moveTo(1, 20);
        ctx.lineTo(39, 39);
        ctx.lineTo(39, 1);
    }
    ctx.closePath();
    ctx.lineWidth = 2;
    if (grey) {
        color = "lightgrey";
    }
    ctx.fillStyle = color;
    ctx.fill();
    button.style = "cursor: pointer; ";

    return button
}

function drawAddAndSubButton(add, grey) {
    var button = document.createElement("button");
    var color = "DodgerBlue";
    var text = "-1";
    //button.setAttribute("width", "20px");
    //button.setAttribute("height", "20px");

    if (add) {
        text = "+1";
        color = "SlateBlue";
    } else {

    }

    if (grey) {
        color = "lightgrey; pointer-events: none;";
    }

    button.innerText = text;
    button.setAttribute("class", "AddAndSub");
    button.style = "background-color: " + color;

    return button
}


function appendicons(iupacComp) {
    var icons_container = document.createElement("div");

    var ind = allMonoOnDisplay.indexOf(iupacComp);
    var keystroke = keyMap[ind];

    var icon = drawMonoIcon(iupacComp);
    icon.addEventListener("mouseover", function (e) {
        hintForShortcut.innerHTML = iupacComp + " can be added when press " + keystroke + " or removed when press shift+" + keystroke;
        hintForShortcut.style = "display: inline; position: absolute; left: " + e.clientX + "px; top: " + e.clientY + "px";
    });
    icon.addEventListener("mouseleave", function (e) {
        hintForShortcut.innerHTML = "";
        hintForShortcut.style = "display: none";
    });



    var g = true;
    if (monofreq[iupacComp] > 0) {
        g = false
    }
    var subbutton = drawAddAndSubButtonOld(false, g);
    subbutton.onclick = function () {
        compositionChange(iupacComp, -1);
    };

    if (maxComp[iupacComp] - monofreq[iupacComp] > 0) {
        g = false
    } else {
        g = true
    }
    var addbutton = drawAddAndSubButtonOld(true, g);
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

    var iconHint = document.createElement("img");
    iconHint.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8Lr6xs3-e3MmHYA6moRFMnmwrdxawtrINAIcSy1bUIwjt3_Jg";
    iconHint.width = 40;
    iconHint.height = 40;
    iconHint.onclick = function () {

    };
    iconHint.addEventListener("mouseover", function (e) {
        contHint.innerText = "- You may use keyboard shortcut to add or subtract the composition for each monosaccharide\n" +
            "- Move cursor to each monosaccharide to learn more\n" +
            "- Double click on glycan in bottom for zooming\n" +
            "- Right click on glycan in bottom to jump to GlyTouCan.org for more detail\n" +
            "- The topologies are sorted based on graph size on bottom";
        contHint.style = "display: inline; position: absolute; left: " + e.clientX + "px; top: " + e.clientY + "px";
    });
    iconHint.addEventListener("mouseleave", function () {
        contHint.innerHTML = "";
        contHint.style = "display: none";
    });
    var contHint = document.createElement("div");
    contHint.style = "display: none";

    leftPanal.appendChild(iconHint);
    leftPanal.appendChild(contHint);
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
    img.style = "width: 200px; height: auto;";
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
    var colnum = parseInt((window.innerWidth - 130) / 204);
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
        if (keyMap.includes(e.key)) {
            var m = allMonoOnDisplay[keyMap.indexOf(e.key)];
            compositionChange(m, 1)
        }
        if (e.shiftKey) {
            if (keyMap.includes(e.key) || keyMap.toUpperCase().includes(e.key)) {
                var m = allMonoOnDisplay[keyMap.indexOf(e.key.toLowerCase())];
                compositionChange(m, -1)
            }
        }
    }
}

keyPress();
