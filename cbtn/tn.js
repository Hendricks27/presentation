"use strict";

// https://www.ncbi.nlm.nih.gov/glycans/snfg.html

var container = document.getElementById("container");
var leftPanal, rightPanal;

var allPossibleMonoOld = ['Man','Gal','Glc','Xyl','Fuc','GlcNAc','GalNAc','NeuAc','NeuGc', "Xxx"];
var allPossibleMono = ['GlcNAc','Man','Gal','Fuc','NeuAc'];
var otherMono = ['Glc','Xyl','GalNAc','NeuGc', "Xxx"];
var keyMapPlus = ["q","w","e","r","t","y","u","i","o"];
var keyMapMinus = ["a","s","d","f","g","h","j","k","l"];
var mono = allPossibleMono.concat(["Xxx"]);

// runtime variable
var matchedTopologies = [];

function convertXxx() {
    for (var gtcid of Object.keys(data)){
        var d = data[gtcid];
        if (d.comp){
            var x = 0;
            for (var i of otherMono){
                if (d.comp[i]){
                    x+=d.comp[i];
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

    leftPanal.style = "float: left; border-color: lightgrey; border-style: solid; width: 150px; margin: 0px; padding: 0px;";
    rightPanal.style = "float: left; border-color: lightgrey; border-style: solid;";
    container.style = "border-color: lightgrey; border-style: solid;";
    
    container.appendChild(leftPanal);
    container.appendChild(rightPanal);
    
}
function resizeContainer() {
    var width = leftPanal.clientWidth + rightPanal.clientWidth;
    var height = Math.max(leftPanal.clientHeight, rightPanal.clientHeight);
    //console.log(height);
    container.style.height = height+5 + "px";
    container.style.width = width+15 + "px";
}

allocateDiv();

function compositionChange(iupac, num) {
    var eleID = iupac + "_count";
    var c = parseInt(document.getElementById(eleID).value);
    if (num<0 && c+num < 0){

    }
    else {
        document.getElementById(eleID).value = c+num;
        afterChange();
    }
}


function appendicons(iupacComp) {
    var monos = allPossibleMono.concat(["Xxx"]);

    var icon = document.createElement("img");
    icon.src = "icons/" + iupacComp.toLowerCase() + ".jpg";
    icon.width = 20;
    icon.height = 20;
    icon.id = iupacComp + "_icon";

    var count = document.createElement("input");
    count.type = "number";
    count.min = "0";
    count.step = "1";
    count.pattern = "\d+";
    count.style = "width: 30px;";
    count.value = "0";
    count.id = iupacComp+"_count";

    var hint = document.createElement("p");
    hint.style = "display: inline";
    hint.id = iupacComp + "_hint";

    var tri_style = "fill:blue; stroke:black; stroke-width: 2px";

    var ind = monos.indexOf(iupacComp);

    var subbutton = document.createElement("canvas");
    subbutton.setAttribute("width", "20px");
    subbutton.setAttribute("height", "20px");
    var ctx = subbutton.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(1, 10);
    ctx.lineTo(19, 19);
    ctx.lineTo(19, 1);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'lightblue';
    ctx.font = "10px Arial";
    ctx.fillText(keyMapPlus[ind].toUpperCase(), 10, 14);
    ctx.stroke();
    subbutton.onclick = function () {
        compositionChange(iupacComp, -1);
    };


    var addbutton = document.createElement("canvas");
    addbutton.setAttribute("width", "20px");
    addbutton.setAttribute("height", "20px");
    var ctx = addbutton.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(1, 1);
    ctx.lineTo(19, 10);
    ctx.lineTo(1, 19);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'SpringGreen';
    ctx.font = "10px Arial";
    ctx.fillText(keyMapMinus[ind].toUpperCase(), 2, 14);
    ctx.stroke();
    addbutton.onclick = function () {
        compositionChange(iupacComp, 1);
    };

    icon.onclick = function(e){
        if (e.detail == 1){
            compositionChange(iupacComp, 1);
        }
        else if (e.detail == 2){
            compositionChange(iupacComp, -1);
        }else {
            //document.getElementById(elementID).value = parseInt(document.getElementById(elementID).value)-2
        }

    };


    count.onchange = function(){
        afterChange();
    };

    leftPanal.appendChild(subbutton);
    leftPanal.appendChild(icon);
    leftPanal.appendChild(addbutton);
    leftPanal.appendChild(count);
    leftPanal.appendChild(hint);
    leftPanal.appendChild(document.createElement("br"));

}

for (var iupacComp of allPossibleMono.concat(["Xxx"])){
    appendicons(iupacComp)
}

function getCurrentComp(){
    var currentComp = {};
    for (var m of allPossibleMono.concat(["Xxx"])){
        var eleId = m + "_count";
        var c = parseInt(document.getElementById(eleId).value);
        currentComp[m] = c;
    }
    return currentComp
}

function afterChange(){


    var currentComp = getCurrentComp();
    var maxComp = {};

    for (var k of Object.keys(currentComp)){
        maxComp[k] = 0;
    }

    matchedTopologies = [];

    for (var gtcid of Object.keys(data)){
        var d = data[gtcid];
        if (d.comp){
            var flag = true;
            for (var mc of Object.keys(currentComp)){
                if (currentComp[mc] != d.comp[mc]){
                    flag = false;
                }
            }
            if (flag){
                matchedTopologies.push(gtcid);
            }
        }
    }

    for (var gtcid of Object.keys(data)){
        var d = data[gtcid];
        if (d.comp){
            var flag = true;
            for (var mc of Object.keys(currentComp)){
                if (currentComp[mc] > d.comp[mc]){
                    flag = false;
                }
            }
            if (flag){
                for (var mc of Object.keys(currentComp)){
                    if (!d.comp[mc]){
                        continue
                    }
                    maxComp[mc] = Math.max(maxComp[mc], d.comp[mc]);
                }
            }
        }
    }
    for (var mc of Object.keys(maxComp)){
        var x = document.getElementById(mc+"_hint");
        x.innerText = Math.max((maxComp[mc]-currentComp[mc]), 0) + " to go";
    }
    updateRightPannal();
}

function getImage(gtcid){
    var figure = document.createElement("figure");
    figure.style.margin = 0;
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
    var colnum = parseInt ((window.innerWidth - 160)/104);
    if (colnum == 0){
        colnum == 1
    }

    rightPanal.innerHTML = "";

    var table = document.createElement("table");
    var row = document.createElement("tr");
    var c = 0;
    matchedTopologies.sort(function (id1, id2) {
        var x = Object.keys(data[id1].content.nodes).length - Object.keys(data[id2].content.nodes).length
        return x
    });

    for (var gtcid of matchedTopologies){
        var f = getImage(gtcid);
        var td = document.createElement("td");

        td.appendChild(f);
        c++;
        if (c%colnum != 0){
            row.appendChild(td);
        }else{
            row.appendChild(td);
            table.appendChild(row);
            row = document.createElement("tr");
        }

    }
    if (c%colnum != 0){
        table.appendChild(row);
    }
    rightPanal.appendChild(table);

    resizeContainer();
}

function keyPress() {
    var d = document.getElementsByTagName("body")[0];
    d.onkeypress = function (e) {
        if (e.ctrlKey){
            if ("qwertyuio".includes(e.key)){
                var m = mono[keyMapPlus.indexOf(e.key)];
                compositionChange(m, 1)
            }else if ("asdfghjkl".includes(e.key)){
                var m = mono[keyMapMinus.indexOf(e.key)];
                compositionChange(m, -1)

            }
        }
        afterChange();
    }
}

keyPress();
