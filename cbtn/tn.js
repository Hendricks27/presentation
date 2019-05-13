"use strict";

// https://www.ncbi.nlm.nih.gov/glycans/snfg.html

var container = document.getElementById("container");
var leftPanal, rightPanal;

var allPossibleMono = ['Man','Gal','Glc','Xyl','Fuc','GlcNAc','GalNAc','NeuAc','NeuGc', "Xxx"];


// runtime variable
var matchedTopologies = [];


function allocateDiv() {
    leftPanal = document.createElement("div");
    rightPanal = document.createElement("div");

    leftPanal.style = "float: left; border-color: lightgrey; border-style: solid; width: 130px; margin: 0px; padding: 0px;";
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


function appendicons(iupacComp) {
    var icon = document.createElement("img");
    icon.src = "icons/" + iupacComp + ".jpg";
    icon.width = 20;
    icon.height = 20;
    icon.id = iupacComp + "_icon";

    var count = document.createElement("input");
    count.type = "number";
    count.min = "0";
    count.step = "1";
    count.pattern = "\d+";
    count.style = "width: 25px;";
    count.value = "0";
    count.id = iupacComp+"_count";

    var hint = document.createElement("p");
    hint.style = "display: inline";
    hint.id = iupacComp + "_hint";

    icon.onclick = function(e){
        var elementID = iupacComp + "_count";
        if (e.detail == 1){
            document.getElementById(elementID).value = parseInt(document.getElementById(elementID).value)+1
        }
        else{
            document.getElementById(elementID).value = parseInt(document.getElementById(elementID).value)-2
        }
        afterChange();

    };


    count.onchange = function(){
        afterChange();
    };


    leftPanal.appendChild(icon);
    leftPanal.appendChild(count);
    leftPanal.appendChild(hint);
    leftPanal.appendChild(document.createElement("br"));

}

for (var iupacComp of allPossibleMono){
    appendicons(iupacComp)
}

function getCurrentComp(){
    var currentComp = {};
    for (var m of allPossibleMono){
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
                    if (!d.comp[mc]){continue}
                    maxComp[mc] = Math.max(maxComp[mc], d.comp[mc]);
                }
            }
        }
    }
    for (var mc of Object.keys(maxComp)){
        var x = document.getElementById(mc+"_hint");
        x.innerText = " Max: " + maxComp[mc];
    }
    updateRightPannal();
}

function getImage(gtcid){
    var figure = document.createElement("figure");
    figure.style.margin = 0;
    var img = document.createElement("img");
    img.src = "http://edwardslab.bmcb.georgetown.edu/~wzhang/web/glycan_images/cfg/extended/" + gtcid + ".png";
    img.style = "width: 100px; height: auto;";
    img.gtcid = gtcid;
    img.onclick = function () {
        v(gtcid);
    };
    var caption = document.createElement("figcaption");
    caption.innerText = gtcid;
    caption.style.textAlign = "center";

    figure.appendChild(img);
    figure.appendChild(caption);

    return figure
}

function updateRightPannal() {
    var colnum = parseInt ((window.innerWidth - 140)/104);
    if (colnum == 0){
        colnum == 1
    }

    rightPanal.innerHTML = "";

    var table = document.createElement("table");
    var row = document.createElement("tr");
    var c = 0;
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








