(function () {
  "use strict";
  let svg = d3.select("#events-viz").append("svg");

  svg
      .append("rect")
      .attr("x", 50)
      .attr("y", 50)
      .attr("height", 100)
      .attr("width", 100)
      .attr("fill", "blue")
  ;

  svg.append("image")
    .attr("xlink:href", "../data/maps/Catalyst_Iso.jpg")
    .attr("width", "100%")
    .attr("height", "100%");
})();
