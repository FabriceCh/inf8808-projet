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
    | Once the data is received, metadata is added for layout/styling purposes
    |
    */

    // For each event category, the height and vertical offset is calculated
    // to correctly position the rows on the graph.
    let players = [data.p1, data.p2];

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
    .domain(Object.keys(data.p1.apms))
    .range(d3.schemeSet1);

    // x scales : for the two player columns
    let x = d3.scaleLinear()
    .domain([0, data.duration])
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
  
    /*
    |--------------------------------------------------------------------------
    | Aggregation Graph
    |--------------------------------------------------------------------------
    */

    // Modifiy margins
    margin.top = 0;
    margin.right = 0;
    margin.bottom = 0;

    let padding = {
      top: 10,
      bottom: 10,
      left: 0,
      right: 0
    };

    // Modify height
    fullHeight = 300;
    height = fullHeight - margin.top - margin.bottom;
    let contentHeight = height - padding.top - padding.bottom;

    console.log(data);

    // Select new SVG
    let svg2 = d3.select("#aggregation").attr("height", fullHeight);

    // Create base group
    let g2 = svg2
    .append("g")
    .attr("transform", `translate(${margin.left} ${margin.top})`);

    /*
    |--------------------------------------------------------------------------
    | Generate each columns for each player
    |--------------------------------------------------------------------------
    */

    for (let i = 1; i <= 2; i++) {

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Group for each player
      |--------------------------------------------------------------------------
      */

      let content = g2.append("g")
      .attr("transform", d => `translate(${i*(width/2)},0)`)
      .call(hover, x);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : White Rectangle for interaction
      |--------------------------------------------------------------------------
      */

      content.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", x(data.duration) + column.gap)
      .attr("height", fullHeight)
      .attr("fill", "#fff");

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Group for drawing
      |--------------------------------------------------------------------------
      */

      let player = content.append("g")
      .attr("transform", d => `translate(0,${padding.top})`);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Background Rectangles
      |--------------------------------------------------------------------------
      */

      player.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", x(data.duration))
      .attr("height", contentHeight)
      .attr("fill", "#f1f1f1");

      /*
      |--------------------------------------------------------------------------
      | Area Chart for each player
      |--------------------------------------------------------------------------
      */
     
      let areaChart = player.append("g").attr("class", "area-chart");

      const MAX_UNIT_N = 120;
      let y = d3
          .scaleLinear()
          .range([contentHeight, 0])
          .domain([0, MAX_UNIT_N]);

      // set the ranges
      x.domain([0, data[`p${i}`].apms.camera.length]);

      /*
      |--------------------------------------------------------------------------
      | Row : Column : Interaction Vertical Line
      |--------------------------------------------------------------------------
      */

      player.append("line")
      .attr("class", "interaction-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", contentHeight)
      .attr("stroke", "#000")
      .attr("display", "none")
    }

    /*
    |--------------------------------------------------------------------------
    | Mouse interaction listener
    |--------------------------------------------------------------------------
    */

    // Display data in tooltip

    let tooltipRows = d3.select("#tooltip")
    .selectAll(".row")
    .data(uniq(data.categories.map(u => u.category)))
    .enter()
    .append("div")
    .attr("class", "row");

    let tooltipTitle = tooltipRows.append("h3")
    .attr("class", "title is-6");

    tooltipTitle.append("span")
    .attr("class", "dot")
    .attr("style", d => `background-color: ${color(d)}`);

    tooltipTitle.append("span").text(d => d.capitalize());

    let tooltipUnits = tooltipRows
    .selectAll(".unit")
    .data(d => data.units.filter(u => u.category === d))
    .enter()
    .append("div")
    .attr("class", "unit");

    tooltipUnits = tooltipUnits.append("div")
    .attr("class", "level");

    tooltipUnits.append("div")
    .attr("class", "name")
    .text(d => d.name);

    let counts = tooltipUnits.append("div")
    .attr("class", "count");

    counts.append("span").attr("id", d => `tooltip-${d.id}-0`).text(d => data.players[0].unit_counts[d.id][1000]);
    counts.append("span").text("-");
    counts.append("span").attr("id", d => `tooltip-${d.id}-1`).text(d => data.players[1].unit_counts[d.id][1000]);

    /**
     * React to mouse actions over a graph
     * 
     * @param {*} g 
     * @param {*} x 
     */
    function hover (g, x) {

      g.style("position", "relative");
      
      g.on("mousemove", moved)
        .on("mouseenter", entered)
        .on("mouseleave", left);

      function moved () {
        d3.event.preventDefault();
        let eventX = d3.mouse(this)[0];
        const xm = x.invert(eventX);
        const i = Math.floor(xm);
        interaction(i, d3.event);
      }

      function entered () {
        interaction(null, d3.event)
      }
          
      function left () {
        interaction(null, d3.event)
      }
    }

    /**
     * Move the tooltip and render lines accross all graphs
     *  
     * @param {*} time (in seconds) 
     * @param {*} event (MouseEvent Object) 
     */
    function interaction(time, event) {

      if (time != null) {
        // Show line
        d3.selectAll(".interaction-line")
        .attr("display", "inline")
        .attr("transform", `translate(${x(time)},0)`);

        // Show tooltip
        let tooltipNode = d3.select("#tooltip")
        .attr("class", "is-active");

        let tooltipHeight = tooltipNode.node().clientHeight;
        let tooltipWidth = tooltipNode.node().clientWidth;
        
        let xTranslation = event.x - tooltipWidth - tooltip.spacing;
        let yTranslation = event.y;
        
        if (window.innerWidth - event.x > tooltipWidth + tooltip.spacing + 20) {
          xTranslation = event.x + tooltip.spacing;
        }

        if (window.innerHeight - event.y < tooltipHeight) {
          yTranslation = event.y - tooltipHeight;
        }

        tooltipNode.attr("style", `transform: translate(${xTranslation}px,${yTranslation}px)`);

        // Update data displayed in tooltip
        data.units.forEach(u => {
          d3.select(`#tooltip-${u.id}-0`).text(d => data.players[0].unit_counts[d.id][time]);
          d3.select(`#tooltip-${u.id}-1`).text(d => data.players[1].unit_counts[d.id][time])
        })

      } else {
        // Hide line
        d3.selectAll(".interaction-line")
        .attr("display", "none");

        // Hide tooltip
        d3.select("#tooltip")
        .attr("class", "");
      }

      if (time > data.duration) {
        // Hide tooltip
        d3.select("#tooltip")
        .attr("class", "");
      }
    }
  
  
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
