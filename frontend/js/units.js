(function () {
  "use strict";

  const filePath = "datafiles/unitcomposition/mockdata.json";

  d3.json(filePath).then(function(data) {
    console.log("test");
    let svg = d3.select("#units-viz").append("svg");

    let g = svg.append("g");

    console.log(data);
    // g.selectAll("circle")
    //     .enter()
    //     .data()
    //     .append("circle")
    // ;
  });
})();
