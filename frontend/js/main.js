(function () {
  "use strict";
  let svg = d3.select("#plot").append("svg");

  svg
    .append("rect")
    .attr("x", 50)
    .attr("y", 50)
    .attr("height", 100)
    .attr("width", 100)
    .attr("fill", "blue")
  ;

})();
