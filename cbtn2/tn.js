"use strict";

var container = document.getElementById("container");

var panelcontainer, hgvcontainer, showAndHideButton;
var leftPanel, rightPanel;

var monoExceptForXxx = ['GlcNAc','GalNAc','ManNAc', 'Glc',  'Gal',  'Man','Fuc', 'NeuAc', 'NeuGc'];
var allMono = monoExceptForXxx.concat(["Xxx"]);

var monofreq = {};
var maxComp = {};

var icon_config = {
    'GlcNAc': {"shape": "square", "icon_color": "rgb(17,0,250)", "count_color": "white"},
    'ManNAc': {"shape": "square", "icon_color": "rgb(0,200,50)", "count_color": "white"},
    'GalNAc': {"shape": "square", "icon_color": "rgb(254,255,0)", "count_color": "black"},
    'Glc': {"shape": "circle", "icon_color": "rgb(17,0,250)", "count_color": "white"},
    'Man': {"shape": "circle", "icon_color": "rgb(0,200,50)", "count_color": "white"},
    'Gal': {"shape": "circle", "icon_color": "rgb(254,255,0)", "count_color": "black"},
    'Fuc': {"shape": "triangle", "icon_color": "rgb(250,0,0)", "count_color": "white"},
    'NeuAc': {"shape": "diamond", "icon_color": "rgb(200,0,200)", "count_color": "white"},
    'NeuGc': {"shape": "diamond", "icon_color": "rgb(233,255,255)", "count_color": "black"},
    'Xxx': {"shape": "circle", "icon_color": "grey", "count_color": "white"}
};

var keyMap = "n   gmfs  ";

var lastClickedTopology = [];
var matchedTopologies = [];

function allcateDIV() {
    
}

function getParaFromURL() {
    
}

function convertXxxInEachData() {
    
}

function init() {
    
}

function compositionChange() {
    
}

function drawEachMonoIcon() {
    
}


function drawAddAndSubButton() {
    
}

function appendIcons() {
    
}

function updateLeftPanel() {
    
}

function afterCompostionChanged() {
    
}

function updateRightPanel() {
    
}

function getImage() {
    
}

function keyPress() {
    
}

function statusChange() {
    
}


