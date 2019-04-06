(function () {
  "use strict";

  // TODO: Change for correct data filepath
  const filePath = "/data/actionstats/realdata.json";

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

    /*
    |--------------------------------------------------------------------------
    | Preprocessing
    |--------------------------------------------------------------------------
    |
    | Once the data is received, data is restructured and metadata is added
    | for layout/styling purposes
    |
    */

    // For each event category, the height and vertical offset is calculated
    // to correctly position the rows on the graph.
    let players = [data.p1, data.p2];
    let player1 = players[0];

    let maxPerCategory = [];
    players.forEach(player => {
      Object.keys(player.apms).forEach(eventCategory => {
        //console.log(player.apms[eventCategory]);
        maxPerCategory.push(d3.max(player.apms[eventCategory]));
      });
    });

    let subPlotHeight = d3.max(maxPerCategory);
    //console.log("subPlotHeight:", subPlotHeight);

    let numEventCategories = Object.keys(player1.apms).length;
    //console.log("numEventCategories:", numEventCategories);

    // Add event category information section
    data.categories = [];
    Object.keys(player1.apms).forEach((eventCategory, i) => {
      let categoryInfo = {};
      categoryInfo.id = eventCategory;
      categoryInfo.name = eventCategory.capitalize();
      categoryInfo.offset = i * subPlotHeight;
      categoryInfo.height = subPlotHeight;
      data.categories.push(categoryInfo);
    });

    // Organize player data as array
    data.players = [];
    players.forEach(playerData => data.players.push(playerData));
    data.p1 = undefined;
    data.p2 = undefined;

    // Change game_length name to duration
    data.duration = data.game_length;
    data.game_length = undefined;

    /*
    |--------------------------------------------------------------------------
    | Dynamically set the height of the SVG with the calculated offset
    |--------------------------------------------------------------------------
    */

    let height = subPlotHeight * numEventCategories;
    let fullHeight = height + margin.top + margin.bottom;

    /*
    |--------------------------------------------------------------------------
    | Scales
    |--------------------------------------------------------------------------
    */

    // Color scale (based on the event category)
    let color = d3.scaleOrdinal()
    .domain(data.categories.map(c => c.id))
    .range(d3.schemeSet1);

    // x scales : for the two player columns
    let x = d3.scaleLinear()
    .domain([0, data.duration])
    .range([0, width/2 - column.gap/2]);
    //console.log("duration:", data.duration)

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
    .data(data.categories.map(c => c.id))
    .enter()
    .append("g")
    .attr('transform', (d,i) => `translate(${i * 100},0)`);
    //console.log(categories);

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
