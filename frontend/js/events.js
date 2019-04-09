(function () {
  "use strict";

  let url_string = window.location.href;
  let url = new URL(url_string);

  const filePath = "/datafiles/" + url.searchParams.get("data") + '.json';

  d3.json(filePath).then(function (data) {
    //console.log("data:", data);

    /*
    |--------------------------------------------------------------------------
    | Layout settings
    |--------------------------------------------------------------------------
    */

    let margin = {
      top: 100,
      left: 120,
      right: 0,
      bottom: 10
    };

    let width = 1344 - margin.left - margin.right;

    // Tooltip settings
    let tooltip = {
      width: 250,
      spacing: 10
    };

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

    // Image section attributes
    let image = {
      width: 400,
      height: 316
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

    // TODO: Set plot heights dynamically?
    let subPlotHeightConst = 15;
    let subPlotHeight = d3.max(maxPerCategory) * subPlotHeightConst;
    //console.log("subPlotHeight:", subPlotHeight);

    let numEventCategories = Object.keys(players[0].apms).length;
    //console.log("numEventCategories:", numEventCategories);

    // Add event category information section
    data.categories = [];
    Object.keys(players[0].apms).forEach((eventCategory, i) => {
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
    delete data.p1;
    delete data.p2;

    // Change game_length name to duration
    data.duration = data.game_length;
    delete data.game_length;

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
    .range(["#FF0000", "#009933" , "#f49542"]);

    // x scales : for the two player columns
    let x = d3.scaleLinear()
    .domain([0, data.duration])
    .range([0, width/2 - column.gap/2]);

    let y = d3.scaleLinear()
    .domain([0, d3.max(maxPerCategory)])
    .range([subPlotHeight, 0]);

    //console.log("duration:", data.duration)

    /*
    |--------------------------------------------------------------------------
    | Base group
    |--------------------------------------------------------------------------
    */

    let svg = d3.select("#viz").attr("height", fullHeight
    //remove the + x here
    + 600
    );

    let g = svg
      .append("g")
      .attr("transform", `translate(${margin.left} ${margin.top})`);

    /*
    |--------------------------------------------------------------------------
    | Players' names
    |--------------------------------------------------------------------------
    */

    for (let i = 0; i < 2; i++) {
      let text = data.metadata.players[i].name;
      if (data.metadata.winner.name == text) {
        text += ' 🏆';
      }
      g.append("text")
      .text(text)
      .attr("y", -13)
      .attr("x", i*width/2 + width/4)
      .attr("text-anchor", "middle")
      .style("font-weight", 500)
      .style("font-size", "1.1rem");
    }

    
    /*
    |--------------------------------------------------------------------------
    | Images group
    |--------------------------------------------------------------------------
    */

    const circleOpacity = 0.4;

    let mapGroup1 = svg
    .append("g");
    
    let mapGroup2 = svg
    .append("g");

    let maps = [mapGroup1, mapGroup2];

    renderMapGroup(mapGroup1, 0, 0);
    renderMapGroup(mapGroup2, 1, width/2);

    function renderMapGroup(mapgroup, playerId, offset) {
      let centerOffset = (x(data.duration) - image.width)/2;
      mapgroup
      .attr("transform", `translate(${margin.left + offset + centerOffset} ${margin.top})`);

      mapgroup
      .append('image')
      .attr('xlink:href','/data/maps/50percentBandW_light.jpg')
      .attr('height', image.height)
      .attr('width', image.width);
      
      mapgroup.selectAll("circle")
          .data(data.players[playerId].events)
          .enter()
        .append("circle")
          .attr("cx", function (d) { return d.location[0]*3.2 - 70; })
          .attr("cy", function (d) { return d.location[1]*2 - 15; })
          .attr("r", 1.5)
          .attr("opacity", circleOpacity)
          .attr("fill", function(d) {
            return color(generalType(d.type));
          });
    }

    /*
    |--------------------------------------------------------------------------
    | Rows Creation
    |--------------------------------------------------------------------------
    */

    let rows = g
    .append("g")
    .selectAll(".row")
    .data(data.categories)
    .enter()
    .append("g")
    //.attr("data-event-id", d => console.log("event:", d))
    .attr("transform", d => `translate(0, ${image.height + d.offset + margin.bottom})`);

    /*
    |--------------------------------------------------------------------------
    | Row : Left Text
    |--------------------------------------------------------------------------
    */

    rows.append("text")
    //.attr("x", -margin.left + 30)
    //.attr("y", 100)
    .attr("text-anchor", "end")
    .attr("x", -10)
    .attr("y", 100)
    .attr("style", "font-weight: 600")
    .text(d => d.name)
    .attr("fill", d => color(d.id))
    .attr("alignment-baseline", "hanging");

    /*
     * brushes
     */
    var brush = d3.brushX()
    .extent([[0, 0], [x(data.duration), subPlotHeight ]])
    .on("brush", function () {
      brushUpdate(mapGroup1, mapGroup2);
    });

    /*
    |--------------------------------------------------------------------------
    | Generate columns for each player
    |--------------------------------------------------------------------------
    */

    for (let i = 0; i < data.players.length; i++) {

      /*
      |--------------------------------------------------------------------------
      | Row : Player
      |--------------------------------------------------------------------------
      */

      let player = rows.append("g")
      .attr("transform", d => `translate(${i*(width/2)}, 0)`)
      .call(hover, x);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Background Rectangles
      |--------------------------------------------------------------------------
      */
/*
      player.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", x(data.duration) + column.gap)
          .attr("height", d => d.height)
          .attr("fill", "#fff");

*/
      player.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", x(data.duration))
          .attr("height", d => d.height - row.margin.top - row.margin.bottom)
          .attr("fill", d => color(d.id))
          .attr("opacity", "0.1");

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Line Graphs
      |--------------------------------------------------------------------------
      */
    
/*
      player.append("g")
      .attr("class", "x axis")
      //.attr("transform", "translate(0," + heightFocus + ")")
      .call(x);

      player.append("g")
      .attr("class", "y axis")
      .call(y);
*/
      let graphLine = d3.line()
        .x(function(d, i) { 
          return x(i);
        })
        .y(function(d) { 
          return y(d);
        })
        .curve(d3.curveBasisOpen);
      
      player
      .append("path")
      .attr("class", "line")
      .attr("d", function(d) {return graphLine(data.players[i].apms[d.id]);})
      .attr("stroke", function(d) {
         return color(d.id);
       })
      .attr("stroke-width", function(d) {
         return 1;
        })
        .attr("fill", "none")
        .attr("transform", `translate(0, ${- row.margin.top - row.margin.bottom})`);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : brushing
      |--------------------------------------------------------------------------
      */
      
      player.append("g")
        .attr("class", "x brush")
        .call(brush);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Interaction Vertical Line
      |--------------------------------------------------------------------------
      */

      player.append("line")
      .attr("class", "interaction-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", d => d.height - row.margin.top - row.margin.bottom)
      .attr("stroke", "#000")
      .attr("display", "none")
      .style("pointer-events", "none");
    }
    
    function brushUpdate(g1, g2) {
      var brushSelection = d3.event.selection;
      let min = x.invert(brushSelection[0]);
      let max = x.invert(brushSelection[1])

      svg.selectAll("circle")
      .attr("visibility", function(d) {
        if(d.second > min && d.second < max) {
          return "visible";
        } else {
          return "hidden";
        }
      })
    }  

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

    for (let i = 0; i < 2; i++) {

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
      x.domain([0, data.duration]);

      




      

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

    let tooltipHeader = d3.select("#tooltip")
    .append("h2")
    .attr("class", "title is-5");

    tooltipHeader
    .append("span")
    .text("Time: ");

    tooltipHeader
    .append("span")
    .attr("class", "time")
    .text("0 seconds");

    let tooltipRows = d3.select("#tooltip")
    .selectAll(".row")
    .data(uniq(data.categories.map(u => u.id)))
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
    .selectAll(".category")
    .data(d => data.categories.filter(u => u.id === d))
    .enter()
    .append("div")
    .attr("class", "category");

    tooltipUnits = tooltipUnits.append("div")
    .attr("class", "level");



    let counts = tooltipUnits.append("div")
    .attr("class", "count");

    counts.append("span").attr("id", d => `tooltip-${d.id}-0`).text(d => data.players[0].apms[d.id][0]);
    counts.append("span").text("-");
    counts.append("span").attr("id", d => `tooltip-${d.id}-1`).text(d => data.players[1].apms[d.id][0]);

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
        tooltipNode.select("h2 .time").text(`${time} seconds`); 
        data.categories.forEach(u => {
          d3.select(`#tooltip-${u.id}-0`).text(d => data.players[0].apms[d.id][time]);
          d3.select(`#tooltip-${u.id}-1`).text(d => data.players[1].apms[d.id][time])
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

})();

/** Get general type of fine event type (like from TargetPointEvent to command event)*/
function generalType(type) {
  if(
      type === "GetControlGroupEvent"
        || type === "SelectionEvent"
        || type === "SetControlGroupEvent"
        || type === "AddToControlGroupEvent"
    ) {
      return "selection";
  } else if(
    type === "TargetPointCommandEvent"
      || type === "TargetUnitCommandEvent"
      || type === "BasicCommandEvent"
      || type === "DataCommandEvent"
  ) {
    return "commands";
  }
  return "camera";
  
}
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
