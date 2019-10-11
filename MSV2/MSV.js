"use strict";

var msv = function () {

    // Basic support functions
    function spcls(container, tag) {
        return (container + '-' + tag);
    }

    function tipcls(type, container, tag) {
        return type + " tip-" + spcls(container, tag);
    }

    var superScript = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    var subscripts = "₀₁₂₃₄₅₆₇₈₉";

    function getSuperscript(num) {
        num += "";
        var newSuperScript = "";

        for (var i = 0; i < num.length; i++) {
            newSuperScript += superScript[parseInt(num[i])];
        }

        return newSuperScript;
    }

    function getSubscript(num) {
        num += "";
        var newSubScripts = "";

        for (var i = 0; i < num.length; i++) {
            newSubScripts += subscripts[parseInt(num[i])];
        }
        return newSubScripts;
    }

    function getLabel(d) {
        if (d.label != undefined) {
            if (d.z > 1) {
                if (d.subscript != undefined) {
                    return (d.label + getSubscript(d.subscript) + getSuperscript(d.z) + '\u207A');
                } else {
                    return (d.label + getSuperscript(d.z) + '\u207A');
                }
            } else {
                if (d.subscript != undefined) {
                    return (d.label + getSubscript(d.subscript));
                } else {
                    return d.label;
                }
            }
        } else {
            return d.simplelabel;
        }
    }

    function toolTip(d, bp) {
        var tt = roundWidthZeros(d.mz);
        tt = tt + ", " + Math.floor(100 * d.int / bp) + "%";
        if (d.delta == undefined) {
            // peak, not fragment
            return tt;
        }

        if (d.delta >= 0) {
            tt += (" (+" + roundWidthZeros(Math.abs(d.delta)) + ")");
        } else {
            tt += (" (-" + roundWidthZeros(Math.abs(d.delta)) + ")");
        }

        return tt;
    }

    function roundWidthZeros(num) {
        num = Math.round(num * 100) / 100;
        if (num == 0) {
            return "0.00";
        }
        if ((num + "").split(".")[1].length <= 1) num += "0"; // adds a zero if the length of the str after the . is less than 2

        return num;
    }

    // Global Variables in this scoop
    var cTags = {};
    var cDims = {};
    var cMaxMZ = {};
    var cCallbacks = {};
    
    // Get info
    var centralControl = function () {

        var panels = [];

        var initializationStatus = {};
        var initializationFunction = {};

        var resizeFunction = {};

        var showBools = {};

        var zoomingGroup = {};


        function addInit(id, initBool, initFunc, zgid) {
            panels.push(id);
            initializationStatus[id] = initBool;
            initializationFunction[id] = initFunc;
            zoomingGroup[id] = zgid;
            showBools[id] = initBool;
        }

        function addResizeFunc(id, resizeFunc) {
            panels.push(id);
            resizeFunction[id] = resizeFunc;
        }

        function titleClickEvent(id) {
            if (!initializationStatus[id]){
                initializationFunction[id]();
            }

            showAndHide(id);


        }

        function showAndHide(id) {

            if (!showBools[id]){}

        }


        return {
            addInit: addInit,
            addResizeFunc: addResizeFunc,
            titleClickEvent: titleClickEvent,
            showAndHide: showAndHide,
            showBools: showBools,
        }
    }();

    x = centralControl;

    var colorTheme = {
        b: "steelBlue", y: "tomato",
        c: "steelBlue", z: "tomato",
        B: "steelBlue", Y: "tomato",
        M: "black",
        other: "grey",
        auc: "lightgrey"
    };


    // Computing functions
    function peakClusterRecognition(peaks){
        var peakCluster = {};

        var peakscopy = JSON.parse(JSON.stringify(peaks)).sort(function(a, b){
            return a.mz - b.mz
        });


        for (var potentialChargeStatus of [1,2,3,4,5,6]) {
            // console.log(potentialChargeStatus);
            peakCluster[potentialChargeStatus] = [];
            for (var peak1 of peakscopy){

                var perCluster = {0:[peak1]};

                for (var peak2 of peakscopy){
                    if (peak1.mz >= peak2.mz){
                        continue
                    }
                    if (peak2.mz - peak1.mz - 0.1 > (1/potentialChargeStatus)*(Math.round(potentialChargeStatus * peak1.mz / 1000) + 3)){
                        continue
                    }

                    var potentialNthPeakInsideCluster = (peak2.mz - peak1.mz) * potentialChargeStatus;
                    if (Math.abs(potentialNthPeakInsideCluster - Math.round(potentialNthPeakInsideCluster)) < 0.04 * potentialChargeStatus){
                        potentialNthPeakInsideCluster = Math.round(potentialNthPeakInsideCluster);
                    }
                    else{
                        continue
                    }

                    if (!(potentialNthPeakInsideCluster in perCluster)){
                        perCluster[potentialNthPeakInsideCluster] = []
                    }
                    perCluster[potentialNthPeakInsideCluster].push(peak2);

                }

                // Check the legitimacy of the potential cluster
                // Only keep the perfect cluster
                var clusterVerfied = true;
                if (Object.keys(perCluster).length == 1){
                    continue
                }
                if (parseInt(Object.keys(perCluster)[Object.keys(perCluster).length-1]) != Object.keys(perCluster).length-1){
                    continue
                }
                for (var peakIndexInsideCluster in perCluster){
                    if (perCluster[peakIndexInsideCluster].length > 1 ){
                        perCluster[peakIndexInsideCluster].sort(function (a, b) {
                            return b.int - a.int
                        });
                        perCluster[peakIndexInsideCluster] = [perCluster[peakIndexInsideCluster][0]]
                    }
                }

                if (clusterVerfied){
                    // console.log(perCluster);
                    peakCluster[potentialChargeStatus].push(perCluster)
                }
            }
        }

        return peakCluster
    }

    function reduceRedundantPeaks(peaks) {
        peaks = JSON.parse(JSON.stringify(peaks));

        peaks.sort(function(a, b){
            return a.mz - b.mz
        });
        var peak0 = [{"mz": peaks[0].mz,"int": 0}];
        var peaklast = {"mz": peaks[peaks.length-1].mz,"int": 0};
        peaks = peak0.concat(peaks);
        peaks.push(peaklast);

        var peakTemp = [];
        var intZeroPeakIndexes = [];
        for (var peaki in peaks){
            if (peaks[peaki].int == 0){
                intZeroPeakIndexes.push(peaki);
            }else{
                peakTemp.push(peaks[peaki])
            }
        }

        for (var i in intZeroPeakIndexes){
            var peak = peaks[intZeroPeakIndexes[i]];
            if (i>0 && i<intZeroPeakIndexes.length-1){
                i = parseInt(i);
                var lastx = parseInt(intZeroPeakIndexes[i-1]);
                var nextx = parseInt(intZeroPeakIndexes[i+1]);
                var thisx = parseInt(intZeroPeakIndexes[i]);
                if (thisx-1 == lastx && thisx+1 == nextx){
                    continue
                }else if(thisx+1 == nextx){
                    // Start point
                    peakTemp.push(peak)
                }else if(thisx-1 == lastx){
                    // End point
                    peakTemp.push(peak)
                }

            }
            else{
                peakTemp.push(peak)
            }
            //console.log(intZeroPeakIndexes[i]);
        }
        peakTemp.sort(function(a, b){
            return a.mz - b.mz
        });
        return peakTemp;
    }



    function appendFragments(fragment, newFragments, peaks, usedPeak, peakClusters, colorThePeak, tolerance, maxPeaksInt, baseHeightPercent){

        var hasFoundPeak = false;
        var bestPeak = {"int": 0, "mz": 0};

        for (var i = 0; i < peaks.length; i++) {
            var peak = peaks[i];

            if (Math.abs(fragment.mz - peak.mz) <= tolerance) {
                if (peak.int >= bestPeak.int) {
                    bestPeak = peak;
                }
                hasFoundPeak = true;
            }
        }

        function isAboveThreshHold(height) {
            return maxPeaksInt * baseHeightPercent <= height;
        }

        if (hasFoundPeak && isAboveThreshHold(bestPeak.int) && !usedPeak[bestPeak.mz.toString()]) {

            usedPeak[bestPeak.mz] = true;

            fragment.delta = (bestPeak.mz - fragment.mz);
            // for positioning...
            fragment.mz = bestPeak.mz;
            fragment.int = bestPeak.int;

            if (colorTheme.hasOwnProperty(fragment.type)) {
                fragment.color = colorTheme[fragment.type];
            }

            // Label the cluster
            // console.log(peakClusters);
            // console.log(fragment);

            var hasFoundCluster = false;
            var correspondingCluster;
            var maxIntForLabel = 0;
            for (var cluster of peakClusters[fragment.z]){
                if (cluster[0][0].mz == bestPeak.mz){
                    correspondingCluster = cluster;
                    hasFoundCluster = true;
                    break;
                }

            }

            if (hasFoundCluster){
                for (var p in correspondingCluster){
                    var pp = correspondingCluster[p][0];
                    usedPeak[pp.mz] = true;

                    //console.log(pp);

                    pp = JSON.parse(JSON.stringify(pp));
                    pp.color = fragment.color;
                    if (pp.int > maxIntForLabel){
                        maxIntForLabel = pp.int;
                    }
                    if ( p != 0 ) {
                        colorThePeak.push(pp);
                    }
                }

            }

            fragment.labelInt = Math.max(fragment.int, maxIntForLabel);
            newFragments.push(fragment);
        }
    }


    // Control functions
    function appendSpectrum(container, tag, width, height) {
        if (container in cDims) {
            // Force additional spectra in a container to match width and height;
            width = cDims[container][0];
            height = cDims[container][1];
        }
        d3.select("#" + container)
            .append("div")
            .attr("id", spcls(container, tag)+"_title");
        d3.select("#" + container)
            .append("svg")
            .attr("class", spcls(container, tag))
            .attr("id", spcls(container, tag))
            .attr("width", width)
            .attr("height", height);
        if (!(container in cTags)) {
            // first reference to a specific container
            cTags[container] = [];
            cTags[container].push(tag);
            cDims[container] = ([width, height]);
            cMaxMZ[container] = {'_max_': 0.0};
            cCallbacks[container] = {}
        } else {
            cTags[container].push(tag);
        }
    }

    function clearSpectrum(container, tag) {
        d3.selectAll("#" + spcls(container, tag)).selectAll("#group").remove();
        d3.selectAll("#tip-" + spcls(container, tag)).remove();
    }

    function deleteSpectrum(container, tag) {
        d3.selectAll("#" + spcls(container, tag)).remove();
        d3.selectAll("#tip-" + spcls(container, tag)).remove();
        for (var i = cTags[container]; i--;) {
            if (cTags[container][i] == tag) {
                cTags[container].splice(i, 1);
            }
        }
        cMaxMZ[container]['_max_'] = 0.0;
        cTags[container].forEach(function (item, index, array) {
            if (cMaxMZ[container]['_max_'] < cMaxMZ[container][item]) {
                cMaxMZ[container]['_max_'] = cMaxMZ[container][item];
            }
        });
    }



    // Exposed functions


    /*
    * params decides
    *  - initial show-hide status
    *  - title tag
    *  - title content
    * */

    // Getting data
    function showLabelledSpectrum(container, tag, params) {
        if (!(container in cTags) || cTags[container].indexOf(tag) < 0) {
            // console.log("append spectrum "+container+" "+tag);
            var width = params["width"] || 1000;
            var height = params["height"] || 300;
            appendSpectrum(container, tag, width, height);
        }
        clearSpectrum(container, tag);

        var spectra = params["spectra"];
        var format = params["format"];
        var scan = params["scan"];

        if (format == "json" && !/\.json$/i.test(spectra)) {
            spectra = spectra + "/" + scan + ".json";
        }

        var data = {
            "spectrum": undefined,
            "annotations": undefined
        };
        var syncStatus = {"spectrum": false};

        if (params.hasOwnProperty("annotations")) {
            syncStatus["annotations"] = false;
            spectrum_parser.getFragmentAnnotation(params["annotations"], function (d) {
                syncStatus["annotations"] = true;
                data["annotations"] = d;
                sync();
            });
        }
        spectrum_parser.getSpectrum(spectra, format, scan, function (d) {
            syncStatus["spectrum"] = true;
            data["spectrum"] = d;
            sync();

        });

        function sync() {
            if (!Object.values(syncStatus).includes(false)){
                showLabelledSpectrumPart2(container, tag, data["spectrum"], data["annotations"], params)
            }
        }

    }

    // Raw data is ready, process data and draw
    function showLabelledSpectrumPart2(container, tag, spectrum, annotation_data, params) {

        var baseHeightPercent = params["intensity_threshold"] || 0.05;
        var tolerance = params["tolerance"] || 0.1;
        if (params["fragment_colors"]){
            colorTheme = params["fragment_colors"];
        }

        if ("show" in params){
            var displayFlag = params["show"]
        }
        else {
            var displayFlag = true;
        }
        var zoomingGroupID = params["zoomgroup"];

        var graphType = params["graphtype"]|| "ms2" ;

        var zoomHeight;
        if (graphType == "chromatogram"){
            zoomHeight = params["zoomHeight"] || true;
        }else{
            zoomHeight = params["zoomHeight"] || false;
        }

        var titleContent = params["title"] || "Unnamed Spectrum";
        var titleTag = params["titleTag"] || "h2";

        var peaks;
        if (graphType == "chromatogram") {
            peaks = [];
            for (var i in spectrum.peaks) {
                i = parseInt(i);
                peaks.push({mz: spectrum.peaks[i].rt, int: spectrum.peaks[i].int});
            }
            // peaks = spectrum.peaks;
        } else if(spectrum.hasOwnProperty('peaks')){
            peaks = spectrum.peaks;
        }else{
            peaks = [];
            for (var i = 0, len = spectrum.mz.length; i < len; i++) {
                peaks.push({mz: spectrum.mz[i], int: spectrum.int[i]});
            }
        }

        var fragments = [];
        if (annotation_data != null) {
            var fragMode = spectrum["fragmentationMode"] || "CID";
            var fragTypes = annotation_data["fragmode2fragtype"][fragMode];
            for (var i = 0; i < fragTypes.length; i++) {
                var frags = annotation_data["byfragtype"][fragTypes.charAt(i)];
                fragments = fragments.concat(frags);
            }
        }



        var newFragments = [];
        var colorThePeak = [];
        var newLinesForEachMatedCluster = [];
        var usedPeak = {};

        var peakClusters = peakClusterRecognition(peaks);

        var maxPeaksInt = d3.max(peaks, function (d) {
            return d.int;
        });
        var maxPeaksMZ = d3.max(peaks, function (d) {
            return d.mz;
        });

        cMaxMZ[container][tag] = maxPeaksMZ;
        cMaxMZ[container]['_max_'] = 0.0;
        cTags[container].forEach(function (item, index, array) {
            if (cMaxMZ[container]['_max_'] < cMaxMZ[container][item]) {
                cMaxMZ[container]['_max_'] = cMaxMZ[container][item];
            }
        });

        // Get rid off continuous peak with 0 intensity
        if (graphType == "chromatogram"){
            peaks = reduceRedundantPeaks(peaks);
        }


        // Order of priority: mass, fragment type,
        var fragmentTypePriority = "YBMybcz";
        fragments.sort(function(a, b){

            if (Math.abs(a.mz - b.mz) > tolerance * 2){
                return a.mz - b.mz
            }

            if (a.type !== b.type){
                var i = fragmentTypePriority.indexOf(a.type);
                var j = fragmentTypePriority.indexOf(b.type);
                if (i == -1){
                    i = 1000
                }
                if (j = -1){
                    j = 1000
                }
                return i - j
            }

            if (a.z !== b.z){
                return a.z-b.z
            }

            return a.mz - b.mz

        });

        function appendFramentsWrapper(fragment){
            appendFragments(fragment, newFragments, peaks, usedPeak, peakClusters, colorThePeak, tolerance, maxPeaksInt, baseHeightPercent);
        }
        fragments.forEach(appendFramentsWrapper);


        /*
        * Data processed ready!
        * Start to draw
        * */

        function drawWrapper(){
            drawStuff(container, tag, maxPeaksMZ, maxPeaksInt, peaks, colorThePeak, newFragments, graphType, zoomHeight, titleContent, titleTag);
        }

        addTitle(container, tag, titleContent, titleTag);
        centralControl.addInit([container, tag], displayFlag, drawWrapper, zoomingGroupID);
        if (displayFlag){
            console.log(titleContent);
            drawWrapper();
        }
        centralControl.showAndHide();

    }

    function addTitle(container, tag, titleContent, titleTag) {
        // Manipulate with title
        d3.select("#"+spcls(container, tag)+"_title")
            .append(titleTag)
            .html(titleContent);
    }

    function drawStuff(container, tag, maxPeaksMZ, maxPeaksInt, peaks, colorThePeak, newFragments, graphType, zoomHeight){

        var margin = {top: 10, bottom: 20, left: 80, right: 40};

        var canvas = d3.select("svg." + spcls(container, tag));

        var canvasWidth = canvas.attr("width");
        var canvasHeight = canvas.attr("height");

        var containerWidth = canvasWidth - (margin.left + margin.right);
        var containerHeight = canvasHeight - (margin.top + margin.bottom);

        var transitionDuration = 500;
        var transitionDelay = 300;
        var transitionType = d3.easeBounce;


        var group = canvas.append("g")
            .attr("class", "group");

        var selectGroup = group.append("g")
            .attr("class", "select")
            .attr("transform", "translate(" + [margin.left, margin.top] + ")");

        var chartGroup = group.append("g")
            .attr("class", "chartGroup")
            .attr("transform", "translate(" + [margin.left, margin.top] + ")");

        var containerGroup = chartGroup.append("g")
            .attr("class", "container");

        var elementGroup = containerGroup.append("g")
            .attr("class", "elements");

        var peakGroup = elementGroup.append("g")
            .attr("class", "peaks");

        var fragmentGroup = elementGroup.append("g")
            .attr("class", "fragments");

        var fragmentOtherPeakGroup = fragmentGroup.append("g")
            .attr("class", "otherPeakGroup");

        var fragmentLabelGroup = fragmentGroup.append("g")
            .attr("class", "labelGroup");

        // fragmentLineGroup
        var chromatographLine = fragmentGroup.append("g")
            .attr("class", "lineGroup");

        var fragmentSelectedGroup = fragmentGroup.append("g")
            .attr("class", "fragementSelectedGroup");

        var xAxisGroup = chartGroup.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + [0, containerHeight] + ")");

        var yAxisGroup = chartGroup.append("g")
            .attr("class", "y axis");

        var resizeGroup = selectGroup.append("g")
            .attr("class", "resize");


        var domain = {min: 0, max: containerWidth};
        var newDomain = {min: 0, max: containerWidth};
        var scale = 1;

        var widthScale = d3.scaleLinear()
            .domain([0, maxPeaksMZ])
            .range([0, containerWidth]);

        var heightScale = d3.scaleLinear()
            .domain([0, maxPeaksInt + 20 * maxPeaksInt / containerHeight])
            .range([0, containerHeight]);

        var xAxisScale = d3.scaleLinear()
            .domain([0, maxPeaksMZ])
            .range([0, containerWidth]);

        var yAxisScale = d3.scaleLinear()
            .domain([maxPeaksInt + 20 * maxPeaksInt / containerHeight, 0])
            .range([0, containerHeight]);

        var clickScale = d3.scaleLinear()
            .domain([0, containerWidth])
            .range([0, maxPeaksMZ]);

        var colorScale = d3.scaleLinear()
            .domain([0, containerWidth])
            .range(["skyBlue", "steelblue"]);

        var drag = d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded);


        var xAxis = d3.axisBottom(xAxisScale)
            .ticks(12)
            .tickSize(3);

        var yAxis = d3.axisLeft(yAxisScale)
            .ticks(Math.max(2, Math.min(6, Math.round(12 * containerHeight / 500))), "s")
            .tickSize(3);

        var peakTip = d3.tip()
            .attr('class', 'd3-tip ' + tipcls("peak-tip", container, tag))
            .offset([-40, 0])
            .html(function (d) {
                return "<span style='color: #3f3f3f' > " + toolTip(d, maxPeaksInt) + " </span>";
            });

        var dePeakRenderOmatic = yAxisGroup.append("rect")
            .attr("x", -margin.left)
            .attr("width", margin.left)
            .attr("height", containerHeight)
            .attr("fill", canvas.style("background-color"));

        var selectArea = selectGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", canvasWidth)
            .attr("height", canvasHeight)
            .attr("fill", "none")
            .style("pointer-events", "all")
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
            });

        var lineFunction = d3.line()
            .x(function (d) {
                return widthScale(d.mz);
            })
            .y(function (d) {
                return (containerHeight - heightScale(d.int));
            });

        var peakElements = peakGroup.selectAll("rect")
            .data(peaks)
            .enter()
            .append("g")
            .attr("class", function (d, i) {
                return "peak " + i;
            })
            .append("rect")
            .attr("x", function (d) {
                return widthScale(d.mz);
            })
            .attr("y", containerHeight)
            .attr("width", 2)
            .attr("height", 0)
            .attr("fill", "white")
            .attr("opacity", "1")
            .on("mouseover", function (d) {
                peakTip.offset([-10, 0]);
                showToolTip("peak-tip", container, tag);
                peakTip.show(d, this);
                hideToolTip("peak-tip", container, tag);
            });


        var fragmentElements = fragmentGroup.selectAll("rect")
            .data(newFragments)
            .enter()
            .append("g")
            .attr("class", function (d, i) {
                return "fragment " + i;
            })
            .append("rect")
            .attr("x", function (d) {
                return widthScale(d.mz);
            })
            .attr("y", containerHeight)
            .attr("width", 2)
            .attr("height", 0)
            .attr("fill", function (d) {
                return d.color;
            })
            .on("mouseover", function (d) {
                peakTip.offset([-23, 0]);
                showToolTip("peak-tip", container, tag);
                peakTip.show(d, this);
                hideToolTip("peak-tip", container, tag);
            });


        var fragmentElementsIntheSameCluster = fragmentOtherPeakGroup.selectAll("rect")
            .data(colorThePeak)
            .enter()
            .append("g")
            .attr("class", function (d, i) {
                return "fragment " + i;
            })
            .append("rect")
            .attr("x", function (d) {
                return widthScale(d.mz);
            })
            .attr("y", containerHeight)
            .attr("width", 2)
            .attr("height", 0)
            .attr("fill", function (d) {
                return d.color;
            });


        var fragmentLabels = fragmentLabelGroup.selectAll("text")
            .data(newFragments)
            .enter()
            .append("g")
            .attr("class", "label")
            .attr("transform", function (d) {
                return "translate(" + [widthScale(d.mz), containerHeight - heightScale(d.labelInt)] + ")";
            })
            .append("text")
            .attr("y", function (d) {
                return heightScale(d.int);
            })
            .attr("text-anchor", "middle")
            .text(function (d) {
                return getLabel(d);
            })
            .style("font-size", "17px")
            .style("opacity", "0");

        peakElements.transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .ease(transitionType)
            .attr("y", function (d) {
                return (containerHeight - heightScale(d.int));
            })
            .attr("height", function (d) {
                return heightScale(d.int);
            })
            .attr("fill", colorTheme.other)
            .attr("opacity", ".5");

        fragmentElements.transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .ease(transitionType)
            .attr("y", function (d) {
                return containerHeight - heightScale(d.int);
            })
            .attr("height", function (d) {
                return heightScale(d.int);
            })
            .attr("fill", function (d) {
                return d.color;
            });

        fragmentElementsIntheSameCluster.transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .ease(transitionType)
            .attr("y", function (d) {
                return containerHeight - heightScale(d.int);
            })
            .attr("height", function (d) {
                return heightScale(d.int);
            })
            .attr("fill", function (d) {
                return d.color;
            });

        fragmentLabels.transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .ease(transitionType)
            .attr("y", -5)
            .style("opacity", "1");


        var newLine = d3.line()
            .x(function (d) {
                return widthScale(d.mz)
            })
            .y(function (d) {
                return containerHeight - heightScale(d.int)
            });

        var chromatographLineElements = chromatographLine.selectAll("path")
            .data([peaks])
            .enter()
            .append("g")
            .append("path")
            .attr('d', newLine)
            .attr("stroke", "black")
            .attr("fill", colorTheme.auc)
            .attr("fill-opacity", "0.7")
            .attr("shape-rendering", "geometricPrecision")
            .attr("vector-effect", "non-scaling-stroke")
            .attr("stroke-width", 1);

        chromatographLineElements.transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .ease(transitionType)
            .style("opacity", "1");


        containerGroup.call(peakTip);
        selectGroup.call(drag);
        xAxisGroup.transition().duration(transitionDelay).call(xAxis);
        yAxisGroup.transition().duration(transitionDelay).call(yAxis);

        /*
        setTimeout(function () {
            resetDomain();
            resizeEnded(true, true);
        }, transitionDuration + transitionDelay);
        */

        // Disable the rectangles or the path
        if (graphType == "chromatogram") {
            elementGroup.selectAll("rect").remove()
        }
        else{
            elementGroup.selectAll("path").remove()
        }

        var originalX;
        var originalY;
        var lastMouseX;
        var lastMouseY;
        var resizeWidth;
        var resizeHeight;
        var selectWidth;
        var selectHeight;

        var isLeftClick;
        var isMiddleClick;
        var isRightClick;

        var zoomDuration = 1000;

        function resetDomain() {
            var domainmax = Math.ceil((cMaxMZ[container]['_max_'] + 0) / 100.0) * 100.0;
            setDomain(0, domainmax);
        }

        function setDomain(minmz, maxmz) {
            newDomain.min = widthScale(minmz);
            newDomain.max = widthScale(maxmz);

            tooltipTransition("*", container, tag, 0, 500, 0);
        }

        function dragStarted() {
            originalX = d3.mouse(this)[0];
            originalY = d3.mouse(this)[1];

            isLeftClick = d3.event.sourceEvent.which == 1;
            isMiddleClick = d3.event.sourceEvent.which == 2;
            isRightClick = d3.event.sourceEvent.which == 3;

            if (isLeftClick) resizeStarted();
            else if (isMiddleClick || isRightClick) resetDomain();
        }

        function dragged() {
            lastMouseX = d3.mouse(this)[0];
            lastMouseY = d3.mouse(this)[1];

            if (isLeftClick) resized();
        }

        function dragEnded() {
            resizeEnded();
        }

        function resizeStarted() {
            resetDomain();

            resizeGroup.append("rect")
                .attr("x", originalX)
                .attr("y", originalY)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("width", 0)
                .attr("height", 2)
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("opacity", 1);
            // .attr("stroke-dasharray", [10, 5])
        }

        function resized() {
            resizeWidth = lastMouseX - originalX;
            resizeHeight = lastMouseY - originalY;

            resizeGroup.selectAll("rect")
                .attr("width", Math.abs(resizeWidth));
            //  .attr("height", Math.abs(resizeHeight));

            if (resizeWidth < 0) {
                resizeGroup.selectAll("rect")
                    .attr("x", lastMouseX);
                newDomain.min = (lastMouseX / scale) + domain.min;
                newDomain.max = (originalX / scale) + domain.min;
            } else if (resizeWidth > 0){
                newDomain.min = (originalX / scale) + domain.min;
                newDomain.max = (lastMouseX / scale) + domain.min;
            }

            //if(resizeHeight < 0){
            // 	resizeGroup.selectAll("rect")
            // 		.attr("y", lastMouseY);
            //}
        }

        function resizeEnded(cascade, metoo) {
            if (cascade == undefined) {
                cascade = true;
            }
            if (metoo == undefined) {
                metoo = false;
            }

            // console.log(d3.select("svg").select(".group").select(".chartGroup").select(".x"));

            xAxisScale.domain([clickScale(newDomain.min), clickScale(newDomain.max)]);
            xAxisGroup.transition().duration(zoomDuration).call(xAxis);

            scale = (maxPeaksMZ) / (clickScale(newDomain.max) - clickScale(newDomain.min));

            var minMZinViewField = clickScale(newDomain.min);
            var maxMZinViewField = clickScale(newDomain.max);
            var maxIntinViewField = 1;

            for (var dot of peaks){
                if (dot.mz >= minMZinViewField && dot.mz <= maxMZinViewField ){
                    if (dot.int > maxIntinViewField){
                        maxIntinViewField = dot.int;
                    }
                }
            }

            var scale2 = 1;
            var translateoffsetforheight = 0;
            if (zoomHeight){
                scale2 = maxPeaksInt / maxIntinViewField;
                translateoffsetforheight = -containerHeight * (scale2-1);
            }

            yAxisScale.domain([(maxPeaksInt + 20 * maxPeaksInt / containerHeight) / scale2, 0]).range([0, containerHeight]);
            yAxisGroup.transition().duration(zoomDuration).call(yAxis);


            domain.min = newDomain.min;
            domain.max = newDomain.max;

            var tempToolTipTransition = false;
            elementGroup.transition()
                .duration(zoomDuration)
                .attr("transform", "translate(" + [-domain.min * scale, 0] + ")scale(" + [scale, 1] + ")")
                .selectAll("rect")
                .attr("width", 2 / scale)
                .on("end", function () {
                    if (! tempToolTipTransition){
                        //tooltipTransition("*", container, tag, 0, 500, 0);
                        tempToolTipTransition = true;
                    }
                    //tooltipTransition("*", container, tag, 0, 500, 0);
                });


            elementGroup.transition()
                .duration(zoomDuration)
                .attr("transform", "translate(" + [-domain.min * scale, translateoffsetforheight] + ")scale(" + [scale, scale2] + ")")
                .selectAll("path")
                .on("end", function () {
                    tooltipTransition("*", container, tag, 0, 500, 0);
                });

            fragmentLabelGroup.selectAll("text").attr("transform", "scale(" + [1 / scale, 1/scale2] + ")");


            if (cascade) {
                cTags[container].forEach(function (item, index, array) {
                    if (item != tag || metoo) {
                        // cCallbacks[container][item](clickScale(newDomain.min), clickScale(newDomain.max));
                    }
                });
            }

            resizeGroup.selectAll("rect")
                .transition()
                .duration(zoomDuration)
                .attr("x", 0)
                .attr("width", containerWidth)
                .attr("opacity", 0)
                .remove();

            tooltipTransition("*", container, tag, 0, 500, 0);
        }

        cCallbacks[container][tag] = (function (a, b) {
            setDomain(a, b);
            resizeEnded(false, false);
        });


    }


    // Tooltip related functions
    function showToolTip(type, container, tag) {
        selectToolTip(type, container, tag).transition()
            .delay(0)
            .duration(0)
            .style("opacity", 1)
            .style('pointer-events', 'all')
    }

    function hideToolTip(type, container, tag) {
        selectToolTip(type, container, tag)
            .on("mouseover", function () {
                selectToolTip(type, container, tag).transition()
                    .delay(0);

            })
            .on("mouseout", function () {
                tooltipTransition(type, container, tag, 0, 500, 0);
            });

        tooltipTransition(type, container, tag, 1500, 500, 0);
    }

    function tooltipTransition(type, container, tag, delay, duration, opacity) {
        selectToolTip(type, container, tag).transition()
            .delay(delay)
            .duration(duration)
            .style("opacity", opacity)
            .style('pointer-events', 'none');
    }

    function selectToolTip(type, container, tag) {
        //selectAll tool tip feature, out of lazyness :p
        if (type == "*") return d3.selectAll(".d3-tip");

        //Selections only work with a periode in the middle
        return d3.selectAll("." + type + ".tip-" + spcls(container, tag));
    }




    function debug() {
        showLabelledSpectrum("container", 4100, {
            "spectra": "./sample_data/ms2.json",
            "annotations": "./sample_data/fragment.json",
            "titleTag": "h3",
            "title": "Hmmmmmm"
        });
        showLabelledSpectrum("container", 4102, {
            "spectra": "./sample_data/ms2.json",
            "annotations": "./sample_data/fragment.json",
            "titleTag": "h3",
            "title": "Hmmmmmm"
        });
        showLabelledSpectrum("container", 4103, {
            "spectra": "./sample_data/ms2.json",
            "annotations": "./sample_data/fragment.json",
            "titleTag": "h3",
            "show": false,
            "title": "Not display"
        });
        showLabelledSpectrum("container", 4104, {
            "spectra": "./sample_data/ms2.json",
            "annotations": "./sample_data/fragment.json",
            "titleTag": "h3",
            "title": "Hmmmmmm"
        });

        showLabelledSpectrum("container2", 4200, {
            "spectra": "./sample_data/chromatogram.json",
            "titleTag": "h3",
            "title": "Chromatogram",
            "graphtype": "chromatogram"
        });
    }

    return {
        debug: debug
    }

};