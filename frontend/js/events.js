(function () {
  "use strict";

  // TODO: Change for correct data filepath
  const filePath = "/data/actionstats/realdata.json";

  // TODO: Remove this print statement
  console.log("Test");

  d3.json(filePath).then(function (data) {

    /*
    |--------------------------------------------------------------------------
    | Layout settings
    |--------------------------------------------------------------------------
    */

    let margin = {
      top: 50,
      left: 120,
      right: 0,
      bottom: 10
    };

    let width = 1344 - margin.left - margin.right;

    let row = {
      // Margin between rows
      margin: {
        top: 10,
        bottom: 10
      }
    };

    // Player column attributes
    let column = {
      gap: 20, // Gap between two columns
    };

    // Lifetime line attributes
    let line = {
      height: 2,
      gap: 1
    };

    // Game metadata
    // TODO: Determine game length dynamically (read timestamp at end of file)
    let game = {
      duration: 30 * 60 // duration of the game in seconds
    };

    /*
    |--------------------------------------------------------------------------
    | Generate random data (TEMP)
    |--------------------------------------------------------------------------
    */

    // TODO: Generate mock event data
    //data = generateRandomData(game.duration);
    console.log(data);

    /*
    |--------------------------------------------------------------------------
    | Preprocessing
    |--------------------------------------------------------------------------
    |
    | Once the data is received, metadata is added for layout/styling purposes
    |
    */

    let offset = 0;
    // TODO: Data preprocessing
    offset = 920;

    /*
    |--------------------------------------------------------------------------
    | Dynamically set the height of the SVG with the calculated offset
    |--------------------------------------------------------------------------
    */

    let fullHeight = offset;
    let height = fullHeight - margin.top - margin.bottom;

    /*
    |--------------------------------------------------------------------------
    | Scales
    |--------------------------------------------------------------------------
    */

    // Color scale (based on the event category)
    let color = d3.scaleOrdinal()
    .domain(Object.keys(data.p1.apms))
    .range(d3.schemeSet1);

    // x scales : for the two player columns
    let x = d3.scaleLinear()
    .domain([0, game.duration])
    .range([0, width/2 - column.gap/2]);

    /*
    |--------------------------------------------------------------------------
    | Base group
    |--------------------------------------------------------------------------
    */

    let svg = d3.select("#viz").attr("height", fullHeight);

    let g = svg
      .append("g")
      .attr("transform", `translate(${margin.left} ${margin.top})`);

    /*
    |--------------------------------------------------------------------------
    | Top Legend
    |--------------------------------------------------------------------------
    */

    // TODO: Remove legend if not required in final design

    let categories = g
    .append("g")
    .attr('transform', (d,i) => `translate(${i * 100},${-margin.top + 20})`)
    .selectAll(".event")
    .data(Object.keys(data.p1.apms))
    .enter()
    .append("g")
    .attr('transform', (d,i) => `translate(${i * 100},0)`);
    console.log(uniq(data.apms.player1.map(u => u.type)));
    console.log(categories);

    categories.append("circle")
    .attr("cx", 7)
    .attr("cy", 0)
    .attr("r", 7)
    .attr("fill", d => color(d));

    categories.append("text")
    .attr("x", 20)
    .attr("y", 5)
    .text(d => d.capitalize());

    let categoryOffset = 0;
    let nodeWidth = (d) => d.getBBox().width;
    categories.attr('transform', function(d, i) {
        let x = categoryOffset;
        categoryOffset += nodeWidth(this) + 15;
        return `translate(${x},0)`
    });

  });



  /*
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
  

    
 */



  //svg.style("background", "../data/maps/Catalyst_Iso.jpg");
  /*
    .attr("xlink:href", "../data/maps/Catalyst_Iso.jpg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("x", 100)
    .attr("y", 100);*/




})();

/** Capitalize */
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
};

function uniq(a) {
  let seen = {};
  return a.filter(function(item) {
      return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  })
}
