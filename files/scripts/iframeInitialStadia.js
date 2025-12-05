// for IE-8
if (!window.console) console = {debug: function() {}};


var dataLines = [];
var mapDataLines = [];
var editMap = false;

var boxElement;
var prevRatio = 0.00;
var observer = null;

var markerLabelLoaded = false;

var mapId = '';

var frameStart = 0;
var pExit = 0;

var viewSent = false;

function initialize() {

    initData(0);

}

function initData(count) {


    if ( ( typeof editData === 'undefined' || typeof maplibregl === 'undefined') && count < 5 ) {

        setTimeout(function () {
            initData(count + 1);
        }, 400);

        return;
    }

    if(typeof editData !== 'undefined'&& typeof maplibregl !== 'undefined')
    {
        processEditData(editData);
    }
    else {
        if(typeof ajaxMapId !== 'undefined' && typeof mapboxgl !== 'undefined'){
            getSomeData(ajaxMapId);

        }
        else {
            $('#map').html("The map could not be loaded.  Try refreshing your browser.");

        }

    }

}


function getSomeData(idStr) {

    var gotData = false;

    $.ajax({
        type: 'POST',
        url: '/util/getMap.php',
        data: ({ id: idStr }),
        cache: false,
        dataType: 'json',
        success:function(data, status, result){

            if(data.errorMessage) {
                alert(data.errorMessage);
            }

            processEditData(data);

            //$("#resultDiv").html(result);
            //console.debug("happy days: " + data.dataLines);


        },
        error:function(data, status, result){

            $('#map').html("The map could not be loaded");

        }
    });

    return gotData;

}


function processEditData(editData){

    var data =  editData;

    if(data.errorMessage) {
        alert(data.errorMessage);
    }

    mapObject = JSON.parse(data.config) ;
    mapId = data.mapid;

    mObject = mapObject;

    if ($("#mapWindowData").length > 0) {
        mapObject.displayDataOnPage = true;
    }

    userSettings = data.userSettings ;

    initProcessData(data.dataLines, dataLines);

    mapDataLines = dataLines;

    showMap();
}


function showMap() {


    //console.debug("time to generate the map!");
//showMap();
    var  mapType =   myMapOptions.indexOf(mapObject.selectedMapType)      ;

    frameStart = new Date().getTime();

    if(window.top !== window.self) {
        if (!("IntersectionObserver" in window)) {

            initMap('map', mapType);

            sendViewFrame();

            return;
        }
        else {
            boxElement = document.querySelector("#map");

            createObserver();
        }
    } else {
        initMap('map', mapType);
        sendNormalView();

    }

}

function createObserver() {

    if(observer != null){
        return;
    }

    observerOn(mapId);
    var options = {
        root: null,
        rootMargin: "0px",
        threshold:  [0.01]
    };

    observer = new IntersectionObserver(handleIntersect, options);
    observer.observe(boxElement);
}




function handleIntersect(entries, observer) {

    entries.forEach(function(entry) {

        if (entry.intersectionRatio > prevRatio) {
           // console.log("visible entry: " + entry.intersectionRatio);
        }
        prevRatio = entry.intersectionRatio;
    });

    if(prevRatio > .01){

        observer.unobserve(boxElement);
      //  console.log("stopping observer");
        observed(mapId);
        var  mapType =   myMapOptions.indexOf(mapObject.selectedMapType)      ;
        initMap('map', mapType);

    }
}

function loadMarkerLabel(callBackFunc, scriptSource, source2) {

    if(markerLabelLoaded == true)
    {
        setTimeout( callBackFunc , 100);

    }

    var script2 = document.createElement("script");
    script2.type = "text/javascript";
    script2.src ="/js/" + scriptSource;
    // script2.src ="/js/markerwithlabel.js";
    document.body.appendChild(script2);

    if(source2 != null){
        var script3 = document.createElement("script");
        script3.type = "text/javascript";
        script3.src ="/js/" + source2;
        // script2.src ="/js/markerwithlabel.js";
        document.body.appendChild(script3);
    }

    markerLabelLoaded = true;

    setTimeout( callBackFunc , 500);

}


function initProcessData( str, dataLines) {

    safeLineProcessor(str, dataLines, mapObject.columnHeaderArray.length);
}

function observerOn(id){
    var statInfo = {};
    statInfo.MapId = id;
    statInfo.view_request_stadia = "true";
    sendViewStats(statInfo);

}

function observed(id){

    if(viewSent == true){
        return;
    }

    viewSent = true;

    var showFrameTime = (new Date().getTime()) - frameStart;

    var statInfo = {};
    statInfo.MapId = id;
    statInfo.viewed_stadia = "true";
    statInfo.showTime = (showFrameTime/ 1000).toFixed(2);
    sendViewStats(statInfo);
}

function sendViewStats(details) {


    $.ajax({
        type: 'POST',
        url: '/mviews/mapViewer.php',
        data: JSON.stringify({mapview: details}),
        contentType: 'application/json; charset=utf-8'
    });
}

function sendViewFrame() {


    if(viewSent == true){
        return;
    }

    viewSent = true;

    var details = {};
    details.MapId = mapId;
    details.viewed_stadia = "true";

    $.ajax({
        type: 'POST',
        url: '/mviews/iframeViewer.php',
        data: JSON.stringify({iframeview: details}),
        contentType: 'application/json; charset=utf-8'
    });
}

function sendNormalView() {

    if(viewSent == true){
        return;
    }

    viewSent = true;

    var details = {};
    details.MapId = mapId;
    details.viewed_stadia = "true";

    $.ajax({
        type: 'POST',
        url: '/mviews/normalViewer.php',
        data: JSON.stringify({normalview: details}),
        contentType: 'application/json; charset=utf-8'
    });
}
