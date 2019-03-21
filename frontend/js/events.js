(function () {
  "use strict";
  let svg = d3.select("#events-viz").append("svg");

  svg.attr("height", "200%")
    .attr("width", "100%");

  var promises = [];
  console.log("test");

  d3.json("../data/datafiles/actionstats/mock_data.json").then(function (data) {
    var player1Events = data.events.player1;
    var player2Events = data.events.player2;
    var player1Apms   = data.apms.player1;
    var player2Apms   = data.apms.player2;

    let g = svg.append("g");

    g.selectAll("circle")
        .data(player1Events)
        .enter()
      .append("circle")
        .attr("cx", function (d) { return d.location[0]; })
        .attr("cy", function (d) { return d.location[1]; })
        .attr("r", 2)
        .attr("fill", function(d) {
          if(d.event_type === "SelectionEvent") {
            return "red";
          } else if(d.event_type === "CommandEvent") {
            return "blue";
          } else {
            return "green";
          }
        });

    console.log(player1Events);
    console.log(player1Events[0].location)
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
