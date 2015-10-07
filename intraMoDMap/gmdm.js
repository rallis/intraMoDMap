/*========================================================================
% Molecular Distance Maps, MoD Maps, Version 2.0 Using Google Maps API v3
% Coded by Rallis Karamichalis, 2014
%
% ----------------------------------------------------------------------
% This is a vizualization tool for creating Molecular Distance Maps
% (MoD Maps). Please refer to the following paper for suggested usage
%
% Rallis Karamichalis, Lila Kari, Stavros Konstantinidis, Steffen Kopecki
% "An investigation into inter- and intragenomic variations of graphic 
% genomic signatures"
% DOI: 10.1186/s12859-015-0655-4 
%
% Kindly report any suggestions or corrections.
%---------------------------------------------------------------------*/

var fileToLoad=-2; 
var distsFileToLoad=-1; // must be both <0 and diff from each other
var alldata; // contains everything from test[i].txt file
var setOfPoints, colors; // first and second line of text file
var numberOfLabels, namesOfLabels; // how many comment lines per point, array of arrays of labels
var dists, howmany; // for computing distances
var globalScaledPointsCoord;
var globalPointsLabels;
var legendColors, legendLabels;
var dbg=false;  // if true shows many dbg msges
var allAccessionNums, allNames; // contains all the accesion numbers and names for searching
var map; // the google map itself

var allCaptions=[
'Model organisms from six Kingdoms; Number of genomic DNA sequences is 508; FCGR with k=9; DSSIM',
'Model organisms from six Kingdoms; Number of genomic DNA sequences is 508; FCGR with k=9; Descriptor',
'Model organisms from six Kingdoms; Number of genomic DNA sequences is 508; FCGR with k=9; Euclidean',
'Model organisms from six Kingdoms; Number of genomic DNA sequences is 508; FCGR with k=9; Manhattan',
'Model organisms from six Kingdoms; Number of genomic DNA sequences is 508; FCGR with k=9; Pearson',
'Model organisms from six Kingdoms; Number of genomic DNA sequences is 508; FCGR with k=9; Approx. Information',
'Sampling from H.Sapiens and M.Musculus; Number of genomic DNA sequences is 450; FCGR with k=9; DSSIM',
'Sampling from H.Sapiens and M.Musculus; Number of genomic DNA sequences is 450; FCGR with k=9; Descriptor',
'Sampling from H.Sapiens and M.Musculus; Number of genomic DNA sequences is 450; FCGR with k=9; Euclidean',
'Sampling from H.Sapiens and M.Musculus; Number of genomic DNA sequences is 450; FCGR with k=9; Manhattan',
'Sampling from H.Sapiens and M.Musculus; Number of genomic DNA sequences is 450; FCGR with k=9; Pearson',
'Sampling from H.Sapiens and M.Musculus; Number of genomic DNA sequences is 450; FCGR with k=9; Approx. Information',
'Sampling from model organisms of six Kingdoms; Number of genomic DNA sequences is 526; FCGR with k=9; DSSIM',
'Sampling from model organisms of six Kingdoms; Number of genomic DNA sequences is 526; FCGR with k=9; Descriptor',
'Sampling from model organisms of six Kingdoms; Number of genomic DNA sequences is 526; FCGR with k=9; Euclidean',
'Sampling from model organisms of six Kingdoms; Number of genomic DNA sequences is 526; FCGR with k=9; Manhattan',
'Sampling from model organisms of six Kingdoms; Number of genomic DNA sequences is 526; FCGR with k=9; Pearson',
'Sampling from model organisms of six Kingdoms; Number of genomic DNA sequences is 526; FCGR with k=9; Approx. Information'
];
var allMarkers; // an array which holds all the markers
var linePath; // global variable of the line A-B  
var lastMarkerClicked;
var allowOnlyOneInfoWindow;


// settings for map
function CoordMapType() {}
CoordMapType.prototype.tileSize = new google.maps.Size(256,256);
CoordMapType.prototype.maxZoom = 20;
CoordMapType.prototype.minZoom = 7;
CoordMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
  var div = ownerDocument.createElement('div');
  //div.innerHTML = coord; //change if you wish
  div.style.width = this.tileSize.width + 'px';
  div.style.height = this.tileSize.height + 'px';
  div.style.fontSize = '10';
  div.style.borderStyle = 'dotted'; // change if you wish
  div.style.borderWidth = '1px';
  div.style.borderColor = '#AAAAAA';
  div.style.backgroundColor = '#ffffff';
  return div;
};
CoordMapType.prototype.name = 'MoD Map';
CoordMapType.prototype.alt = 'MoD Map';


function loadXMLDoc(){  
  document.getElementById("settingsaction").innerHTML="Loading MAP, please wait...";
  var xmlhttp;
  if (window.XMLHttpRequest){ // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
  }else{ // code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange=function(){
    if (xmlhttp.readyState==4 && xmlhttp.status==200){
      document.getElementById("temp").innerHTML=xmlhttp.responseText;
      alldata=document.getElementById("temp").innerHTML;
      document.getElementById("temp").innerHTML="";
      allowOnlyOneInfoWindow=document.getElementById("manyinfowindows").checked;
      if(dbg){
        document.getElementById("fromHere").style.visibility="visible";
        document.getElementById("toHere").style.visibility="visible";
      }
      if(dbg){alert("to call initialize..");}
      initialize(); // calls gmap initialization
      if(dbg){alert("to call computeDist..");}
      computeDist(true); // load dist file
    }
  }
  xmlhttp.open("GET","maps/map"+fileToLoad+".txt",true);
  xmlhttp.send();
}

function initialize() {
  if(dbg){alert("begin initialize..");}
  var res=alldata.split("\n");
  setOfPoints=res[0].split(','); 
  colors=res[1].split(',');  
  numberOfLabels=parseFloat(res[2]);
  namesOfLabels=res[3].split(',');
  legendColors=res[4].split(',');
  legendLabels=res[5].split(',');
  allAccessionNums=new Array();
  allNames= new Array();

  // read data from files
  var pointsCoord = new Array();
  var pointsLabels = new Array();
  var pt_counter=-1;
  for(var ind=6; ind<res.length;ind=ind+2+numberOfLabels){
        pt_counter++;
        pointsCoord[pt_counter]=[res[ind],res[ind+1]];
        pointsLabels[pt_counter]=[];
        for(var comm_ind=0;comm_ind<numberOfLabels;comm_ind++){
              pointsLabels[pt_counter].push(res[ind+2+comm_ind]);
        }
  }
  globalPointsLabels=pointsLabels;

  // ALL DEBUG ALERTS
  if(dbg){
    alert("setofpoints="+setOfPoints);
    alert("colors="+colors);
    alert("#labels="+numberOfLabels);
    alert("namesLabels="+namesOfLabels);
    alert("lgnd_Colors="+legendColors);
    alert("lgnd_labels="+legendLabels);
    alert("globalPointsLabels="+globalPointsLabels);
  }

  // MAP SETTINGS
  var origin = new google.maps.LatLng(0,0);
  var coordinateMapType = new CoordMapType();
  var mapOptions = {
    zoom: 8,
    center: origin,
    streetViewControl: false, 
    mapTypeId: 'coordinate',
    mapTypeControlOptions: {
      mapTypeIds: ['coordinate']
    }
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);

  // actual drawing
  scaledPointsCoord = new Array();
  allMarkers = new Array();
  var marker, popupInfo;
  var s=-1;
  for(var i=0; i<setOfPoints.length;i++){
        for(var j=0; j<parseFloat(setOfPoints[i]); j++){
              s++;
              var centerX=parseFloat(pointsCoord[s][0]);
              var centerY=parseFloat(pointsCoord[s][1]);
              scaledPointsCoord[s]=[centerX,centerY];
              
              var titleInfo, titleInfoPart1, titleInfoPart2, titleInfoPart3, titleInfoPart1half;
              var popupdata="";
              var fcgrInfo, fromField, toField, pointToShow;
              
              for(var k=0;k<numberOfLabels;k++){
                  if(namesOfLabels[k]=="Name"){
                    allNames[s]=globalPointsLabels[s][k];
                    titleInfoPart3 = namesOfLabels[k]+": "+globalPointsLabels[s][k]+"\n";
                    popupdata=popupdata+"<tr><td>"+namesOfLabels[k]+"</td><td><strong>"+globalPointsLabels[s][k]+"</strong></td></tr>";
                  }else if(namesOfLabels[k]=="Acc"){
                  	allAccessionNums[s]=globalPointsLabels[s][k];
                    
                    pointToShow = globalPointsLabels[s][0];
                    titleInfoPart1 = "Point: " + pointToShow + "\n";
                  	
                  	fromField='&#160;&#160;&#160;<input type="submit" id="from" onclick="put('+s+',1,'+pointToShow+');" value="From here">&#160;&#160;&#160;';
                    toField='<input type="submit" id="to" onclick="put('+s+',2,'+pointToShow+');" value="To here">';
                    titleInfoPart2 = "Accession: "+globalPointsLabels[s][k]+"\n";
                    popupdata=popupdata+"<tr><td>"+namesOfLabels[k]+"</td><td><strong>"+globalPointsLabels[s][k]+"</strong></td></tr>";
                  }else if(namesOfLabels[k]=="Fragment"){ 
                    pointToShow = parseFloat(globalPointsLabels[s][0]);
                    titleInfoPart1 = "Point: " + pointToShow + "\n";
                    fromField='<input type="submit" id="from" onclick="put('+parseFloat(pointToShow-1)+',1,'+pointToShow+');" value="From here">&nbsp &nbsp';
                    toField='<input type="submit" id="to" onclick="put('+parseFloat(pointToShow-1)+',2,'+pointToShow+');" value="To here">';

                    if((fileToLoad>=7)&&(fileToLoad<=12)){
                      popupdata=popupdata+"";
                    }else{
                      popupdata=popupdata+"<tr><td>"+namesOfLabels[k]+"</td><td><strong>"+globalPointsLabels[s][k]+"</strong></td></tr>";
                    }

                    if((fileToLoad>=7)&&(fileToLoad<=12)){
                      titleInfoPart1half="";
                    }else{
                      titleInfoPart1half="Fragment: "+globalPointsLabels[s][k]+"\n";
                    }

                    if((fileToLoad>=1)&&(fileToLoad<=6)){
                    	fcgrInfo='<tr><td>CGR</td><td><div id="fcgr'+globalPointsLabels[s][0]+'" class="fcgrImage"><a href="fcgrs/1/'+globalPointsLabels[s][0]+'.png" target="_blank"><img src="fcgrs/1/'+globalPointsLabels[s][0]+'.png" height="200" width="200px" alt="FCGR IMAGE NOT AVAILABLE" title="Click here to Zoom In"></a></div></td></tr>';	
                    }
                    if((fileToLoad>=7)&&(fileToLoad<=12)){
                      fcgrInfo='<tr><td>CGR</td><td><div id="fcgr'+globalPointsLabels[s][0]+'" class="fcgrImage"><a href="fcgrs/4/'+globalPointsLabels[s][0]+'.png" target="_blank"><img src="fcgrs/4/'+globalPointsLabels[s][0]+'.png" height="200" width="200px" alt="FCGR IMAGE NOT AVAILABLE" title="Click here to Zoom In"></a></div></td></tr>';  
                    }
                    if((fileToLoad>=13)&&(fileToLoad<=18)){
                      fcgrInfo='<tr><td>CGR</td><td><div id="fcgr'+globalPointsLabels[s][0]+'" class="fcgrImage"><a href="fcgrs/3/'+globalPointsLabels[s][0]+'.png" target="_blank"><img src="fcgrs/3/'+globalPointsLabels[s][0]+'.png" height="200" width="200px" alt="FCGR IMAGE NOT AVAILABLE" title="Click here to Zoom In"></a></div></td></tr>';  
                    }
                    
                  }else if(namesOfLabels[k]=="Link"){
                  	popupdata=popupdata+'<tr><td>NCBI</td><td><a href="http://www.ncbi.nlm.nih.gov/nuccore/'+globalPointsLabels[s][k]+'" target="_blank">here</a></td></tr>';
                  }else if(namesOfLabels[k]=="Length"){
                    popupdata=popupdata+"<tr><td>Length</td><td><strong>"+globalPointsLabels[s][k]+" bp</strong></td></tr>";
                  }else if(namesOfLabels[k]=="Index"){
                    // do nothing, that is do not show Index
                  }else{
                    popupdata=popupdata+"<tr><td>"+namesOfLabels[k]+"</td><td>"+globalPointsLabels[s][k]+"</td></tr>";
                  }
              }
              popupdata = popupdata + fcgrInfo;
              popupdata = popupdata + "</table>";
              popupdata = popupdata + fromField;
              popupdata = popupdata + toField;
              titleInfo = titleInfoPart1 + titleInfoPart1half+ titleInfoPart2 + titleInfoPart3;
              popupdata = "<table><tr><td>Point</td><td><strong>"+pointToShow+"</strong></td></tr>" + popupdata;              
              

              popupInfo = new google.maps.InfoWindow({
                  content: popupdata,
                  maxWidth: 300
              });
              var image = 'newmarkers5/'+colors[i]+'.png';
              var image = new google.maps.MarkerImage('newmarkers5/'+colors[i]+'.png',
                          new google.maps.Size(11,11),   
                          new google.maps.Point(0, 0),
                          new google.maps.Point(5,5));

              marker = new google.maps.Marker({
                  position: new google.maps.LatLng(centerY, centerX),
                  map: map,
                  title: titleInfo,
                  icon:image,
                  infowindow: popupInfo
              });
              allMarkers.push(marker);

              google.maps.event.addListener(marker, 'click', function() {
                if(this.getAnimation()!=null){
                  this.setAnimation(null);
                }else{
                  if((lastMarkerClicked!=undefined)&&allowOnlyOneInfoWindow){lastMarkerClicked.infowindow.close(map);}	
                  this.infowindow.open(map,this);
                  lastMarkerClicked=this;  
                }
              });
        }
  }

  // assign GLOBAL variables
  globalScaledPointsCoord=scaledPointsCoord; 
  document.getElementById("settingsaction").innerHTML='';
  document.getElementById("fromHere").value="";
  document.getElementById("toHere").value="";
  document.getElementById("fromHereToShow").innerHTML="<strong>From Point: - </strong>";
  document.getElementById("toHereToShow").innerHTML="<strong>To Point: - </strong>";
  document.getElementById("outputDist").value="";
  
  // MAKE LEGEND AND ADD IT in the map
  var legend = document.getElementById('mylegend');
  var tmpLegendsHTML=document.createElement('div');
  var tmpCaptionHTML=document.createElement('div');
  legend.appendChild(tmpLegendsHTML);
  legend.appendChild(tmpCaptionHTML);
  for (var styleInd=0; styleInd<legendColors.length; styleInd++) {
    var div = document.createElement('div');
    div.className="legendlabel";
    div.innerHTML = '<img src="legends/'+legendColors[styleInd]+'.png" height="20">'+legendLabels[styleInd].charAt(0).toUpperCase()+legendLabels[styleInd].slice(1);
    tmpLegendsHTML.appendChild(div);
  }
  tmpLegendsHTML.style.border="2px solid #000000";
  tmpLegendsHTML.style.margin="3px";
  tmpLegendsHTML.style.backgroundColor="white";
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(tmpLegendsHTML);

  // CAPTION of the map
  tmpCaptionHTML.style.border="1px solid #000000";
  tmpCaptionHTML.style.padding="2px";
  tmpCaptionHTML.style.backgroundColor="white";
  tmpCaptionHTML.style.fontSize="small";
  tmpCaptionHTML.innerHTML=allCaptions[fileToLoad-1];
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(tmpCaptionHTML);
  
  // if you change map to genomemap
  google.maps.event.addListener(map, 'maptypeid_changed', function() {
    var showStreetViewControl = map.getMapTypeId() != 'coordinate';
    map.setOptions({'streetViewControl': showStreetViewControl});
  });
  // Now attach the coordinate map type to the map's registry
  map.mapTypes.set('coordinate', coordinateMapType);

  if(dbg){alert("end initialization..");}
}

function put(id, field, toShow){
  if(dbg){alert('In ['+field+"]: show ["+toShow+"] while is ["+id+"]");}
  if(field==1){document.getElementById("fromHere").value=id;document.getElementById("fromHereToShow").innerHTML="<strong>From Point: ["+toShow+"]</strong>";}
  if(field==2){document.getElementById("toHere").value=id;document.getElementById("toHereToShow").innerHTML="<strong>To Point: ["+toShow+"]</strong>";}
  computeDist(false);
  drawLine();
}

function drawLine(){
  if(linePath!=undefined){linePath.setMap(null);}
  var pointA=document.getElementById("fromHere").value;
  var pointB=document.getElementById("toHere").value;
  if((pointA=="")||(pointB=="")){return;}

  var lineCoordinates = [
    new google.maps.LatLng(globalScaledPointsCoord[pointA][1], globalScaledPointsCoord[pointA][0]),
    new google.maps.LatLng(globalScaledPointsCoord[pointB][1], globalScaledPointsCoord[pointB][0])
  ];
  linePath = new google.maps.Polyline({
    path: lineCoordinates,
    strokeColor: '#000000',
    strokeOpacity: 1.0,
    strokeWeight: 3
  });
  linePath.setMap(map);
}

function computeDist(preload){
  if(dbg){alert("preload= "+preload);}
  var idFrom=document.getElementById("fromHere").value;
  var idTo=document.getElementById("toHere").value;
  //var idFrom=parseFloat(document.getElementById("fromHere").value);
  //var idTo=parseFloat(document.getElementById("toHere").value);
  
  if(((idFrom!="")&&(idTo!=""))||(preload==true)){
    
    if(fileToLoad==distsFileToLoad){
      if(dbg){alert("Equal fileToLoadme distsFileToLoad");}
      document.getElementById("outputDist").value="";
      document.getElementById("computeDist").innerHTML="Accessing element..."+"<img src=\"loading.gif\" height='30'>";
      // revert back
      if((idFrom!="")&&(idTo!="")){
        idFrom=parseFloat(globalPointsLabels[idFrom][0]);
        idTo=parseFloat(globalPointsLabels[idTo][0]);
        var res=dists[(idFrom-1)*howmany+idTo-1]; 
      }
      if(preload!=true){document.getElementById("outputDist").value=res;}
      document.getElementById("computeDist").innerHTML="";
      return;
    }

    document.getElementById("computeDist").innerHTML="Loading DistanceMatrix["+fileToLoad+"]..."+"<img src=\"loading.gif\" height='30'>";
    var xmlhttp;
    if (window.XMLHttpRequest){ // code for IE7+, Firefox, Chrome, Opera, Safari
          xmlhttp=new XMLHttpRequest();
    }else{ // code for IE6, IE5
          xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function(){
      if (xmlhttp.readyState==4 && xmlhttp.status==200){
          // read file and indices from html
          dists=xmlhttp.responseText.split("\n");
          howmany=Math.sqrt(dists.length);
          document.getElementById("computeDist").innerHTML="";
          distsFileToLoad=fileToLoad;
      }
    }
    xmlhttp.open("GET","dists/dists"+fileToLoad+".txt",true);
    xmlhttp.send();
  }
}


function checkForPopups(){
	if(document.getElementById("manyinfowindows").checked==false){
		allowOnlyOneInfoWindow=false;
	}else{
		allowOnlyOneInfoWindow=true;
		for(var i=0; i<allMarkers.length; i++){
			allMarkers[i].infowindow.close(map);
		}
	}
}

function selectandloadXMLDoc(id){
  fileToLoad=id;
  loadXMLDoc();
}

