var curl = window.location.href.split("/");
var pagename = curl[curl.length-1];
var paraFromPage = [];

if ( pagename.startsWith("TG") ){
    checkElement();
}

function checkElement() {
    var pot = document.getElementsByClassName("mw-parser-output");
    var msl = pot[0].getElementsByTagName("p");
    var msele = msl[msl.length - 1];

    var elestring = "";
    var lastprecscan = "";
    for (var i in msele.innerText.split("\n")){

        var sth = msele.innerText.split("\n")[i];
        if (sth == ""){
            continue
        }
        var scandetails = sth.split(";");
        var precscan = scandetails[3];
        if (precscan != lastprecscan) {
            paraFromPage.push({title: "Scan: "+precscan, scan: precscan, annotations: false, zoomHeight: true});
            lastprecscan = precscan;
        }
        var title = "";
        if (scandetails.length == 2) {
            title = "Scan: "+scandetails[0]+" ("+scandetails[1]+")";
        } else {
            title = "Scan: "+scandetails[0]+" ("+scandetails[1]+" @ "+scandetails[2]+" min, m/z "+scandetails[4]+" scan " +scandetails[3]+")";
        }
        paraFromPage.push({title: title, scan: scandetails[0], annotations: true});
    }

    msele.innerHTML = "";
}

if (!( Object.keys(paraFromPage).length === 0 && paraFromPage.constructor === Object)){
    injectResources();
}


function injectResources() {

    //https://cdn.jsdelivr.net/gh/glygen-glycan-data/JSWidgets/MS_Viewer/
    var external_resources = [
        "https://cdnjs.cloudflare.com/ajax/libs/d3/5.12.0/d3.min.js",
        "./spectrum-parsers.js",
        "./MSV.js",
        "./util.js"
    ];

    var js_status = {};
    for (var i in external_resources){
        var jsurl = external_resources[i];
        js_status[jsurl] = false;
        getScript(jsurl, sync1);
    }

    function getScriptCached(url, callback) {
        jQuery.ajax({
            type: "GET",
            url: url,
            success: callback,
            dataType: "script",
            cache: true
        });
    }

    //jQuery.ajaxSetup({cache: true});
    function getScript(url, func) {
        getScriptCached(url, function () {
            js_status[url] = true;
            func();
        });
    }

    $("head").append("<link rel='stylesheet' href='https://cdn.jsdelivr.net/gh/glygen-glycan-data/JSWidgets/MS_Viewer/spectrum-viewer.css' type='text/css'>");

    function sync1() {

        var flag = true;
        for (var i in js_status){
            if (!js_status[i]){
                flag = false;
            }
        }
        if (flag){
            // console.log("loading partial complete");
            getD3TIP();
        }
    }

    function getD3TIP() {
        getScript("https://cdnjs.cloudflare.com/ajax/libs/d3-tip/0.9.1/d3-tip.min.js", sync2);
    }

    function sync2() {
        // console.log("loading complete");
        loadSVG();
    }
}

function loadSVG() {
    // console.log("Start drawing");

    var pot = document.getElementsByClassName("mw-parser-output")[0];

    var msContainer = document.createElement("div");
    msContainer.setAttribute("id", "specpanel");
    pot.appendChild(msContainer);

    var peptideAcc = document.getElementById("msv_para").getAttribute("data-peptide");
    var charger = document.getElementById("msv_para").getAttribute("data-z1");
    var pmz = document.getElementById("msv_para").getAttribute("data-mz1");
    var spectra_folder = document.getElementById("msv_para").getAttribute("data-spectra");
    var showxic = document.getElementById("msv_para").getAttribute("data-showxic") || "true";

    // convert to boolean...
    showxic = (showxic.trim().toLowerCase() != "false");

    var showcycle = document.getElementById("msv_para").getAttribute("data-showcycle") || "false,true,true";

    // convert to array of boolean...
    showcycle = showcycle.split(",");
    var showcyclearray = [];
    for (var i in showcycle) {
        showcyclearray.push((showcycle[i].trim().toLowerCase() != "false"));
    }

    var param0 = {
        spectra: "",
        format: "json",
        graphtype: "chromatogram",
        zoomHeight: true,
        zoomgroup: 0,
        title: "Chromatogram"
    };

    msv = msv();

    if (showxic) {

        param0["spectra"] = "https://edwardslab.bmcb.georgetown.edu/~nedwards/dropbox/pBYmLSkGeq/" + spectra_folder + "/" + peptideAcc + "." + charger + '.json';
        param0["width"] = pot.clientWidth * 0.995;
        msv.addLabelledSpectrum('specpanel','chrom', param0);
    }

    for (var i in paraFromPage) {
        var sc = paraFromPage[i]["scan"];
        var title = paraFromPage[i]["title"];
        var params = {
            scan: sc,
            format: "json",
            spectra: "https://edwardslab.bmcb.georgetown.edu/~nedwards/dropbox/pBYmLSkGeq/" + spectra_folder + "/" + sc + '.json',
            width: pot.clientWidth * 0.995,
            zoomgroup: 1,
            show: false,
            title: title
        };

        if (paraFromPage[i]["annotations"]) {
            params["annotations"] = "https://edwardslab.bmcb.georgetown.edu/~nedwards/dropbox/pBYmLSkGeq/annotations/" + peptideAcc + "." + charger + ".json";
        }
        if (paraFromPage[i]["zoomHeight"]) {
            params["zoomHeight"] = true;
        } else {
            params["zoomHeight"] = false;
        }

        if (["12869", "12871"].includes(sc)){
            params["show"] = true;
        }
        msv.addLabelledSpectrum('specpanel','spec'+sc, params);
    }

    msv.done();

}
