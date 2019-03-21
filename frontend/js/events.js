(function () {
  "use strict";
  let svg = d3.select("#events-viz").append("svg");

  svg.attr("height", "200%")
    .attr("width", "100%");

  svg
    .append("rect")
    .attr("x", 50)
    .attr("y", 50)
    .attr("height", 100)
    .attr("width", 100)
    .attr("fill", "blue")
  ;

  var promises = [];
  console.log("test");

  d3.json("../data/datafiles/actionstats/mock_data.json").then(function (data) {
    var player1Events = data.events.player1;
    var player2Events = data.events.player2;
    var player1Apms   = data.apms.player1;
    var player2Apms   = data.apms.player2;

    console.log(player1Events);
  });
  

    



  //svg.style("background", "../data/maps/Catalyst_Iso.jpg");
  /*
    .attr("xlink:href", "../data/maps/Catalyst_Iso.jpg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("x", 100)
    .attr("y", 100);*/

  (function addLocationsOnMap(){

  })()
})();
