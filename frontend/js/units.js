(function () {
  "use strict";

  const filePath = "/data/unitcomposition/mockdata.json";

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

    // Game metadata
    let game = {
      duration: 30 * 60 // duration of the game in seconds
    };

    /*
    |--------------------------------------------------------------------------
    | Generate random data (TEMP)
    |--------------------------------------------------------------------------
    */

    data = generateRandomData(game.duration);
    console.log(data);

    /*
    |--------------------------------------------------------------------------
    | Preprocessing
    |--------------------------------------------------------------------------
    |
    | Once the data is received, metadata is added for layout/styling purposes
    |
    */
    
    // For each unit, the height and vertial offset is calculated 
    // to correctly position the rows on the graph.
    let offset = 0;
    data.units = data.units.map(u => {
      u.offset = offset + row.margin.top;
      u.height = d3.max(data.players, p =>p.unit_lifetimes[u.id].length) * (line.height+line.gap);
      offset += u.height + row.margin.bottom;
      return u
    });

    // Sort unit_lifetimes 
    data.players.forEach(p => {
      Object.keys(p.unit_lifetimes).forEach(key => {
        p.unit_lifetimes[key] = p.unit_lifetimes[key].sort((a,b) => {
          return (a[0] > b[0]) ? 1 : -1
        })
      })
    });

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

    // Color scale (based on the unit category)
    let color = d3.scaleOrdinal()
    .domain(data.units.map(u => u.category))
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

    let categories = g
    .append("g")
    .attr('transform', (d,i) => `translate(${i * 100},${-margin.top + 20})`)
    .selectAll(".unit")
    .data(uniq(data.units.map(u => u.category)))
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
    | Rows Creation
    |--------------------------------------------------------------------------
    */

    let rows = g
    .append("g")
    .selectAll(".row")
    .data(data.units)
    .enter()
    .append("g")
    .attr("data-unit-id", d => d.id)
    .attr("transform", d => `translate(0,${d.offset})`);

    /*
    |--------------------------------------------------------------------------
    | Row : Left Text
    |--------------------------------------------------------------------------
    */

    rows.append("text")
    .attr("x", -margin.left)
    .attr("y", 0)
    .text(d => d.name)
    .attr("alignment-baseline", "hanging");

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
      .attr("transform", d => `translate(${i*(width/2)},0)`)
      .call(hover, x);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Background Rectangles
      |--------------------------------------------------------------------------
      */

      player.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", x(game.duration))
      .attr("height", d => d.height)
      .attr("fill", d => color(d.category))
      .attr("opacity", "0.1");

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Lifetime lines
      |--------------------------------------------------------------------------
      */

      player.append("g")
      .selectAll(".line")
      .data(d => data.players[i].unit_lifetimes[d.id])
      .enter()
      .append("line")
      .attr("x1", d => d[0] / game.duration * (width/2 - column.gap/2))
      .attr("x2", d => d[1] / game.duration * (width/2 - column.gap/2))
      .attr("y1", (d,i) => i*(line.height+line.gap))
      .attr("y2", (d,i) => i*(line.height+line.gap))
      .attr("stroke", (d,i,node) => {
        let unit = getUnitFormNode(node);
        return color(unit.category)
      });

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
      .attr("y2", d => d.height)
      .attr("stroke", "#000")
      .attr("display", "none")

    }

    /*
    |--------------------------------------------------------------------------
    | Aggregation Graph
    |--------------------------------------------------------------------------
    */

    // Modifiy margins
    margin.top = 10;
    margin.right = 0;
    margin.bottom = 10;

    // Modify height
    fullHeight = 300;
    height = fullHeight - margin.top - margin.bottom;

    // Select new SVG
    svg = d3.select("#aggregation").attr("height", fullHeight);

    // Create base group
    g = svg
    .append("g")
    .attr("transform", `translate(${margin.left} ${margin.top})`);

    /*
    |--------------------------------------------------------------------------
    | Generate each columns for each player
    |--------------------------------------------------------------------------
    */

    for (let i = 0; i < data.players.length; i++) {

      /*
      |--------------------------------------------------------------------------
      | Row : Player (group for each player)
      |--------------------------------------------------------------------------
      */

      let player = g.append("g")
      .attr("transform", d => `translate(${i*(width/2)},0)`)
      .call(hover, x);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Background Rectangles
      |--------------------------------------------------------------------------
      */

      player.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", x(game.duration))
      .attr("height", height)
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
          .range([height, 0])
          .domain([0, MAX_UNIT_N]);

      // set the ranges
      x.domain([0, data.players[i].unit_counts.probe.length]);

      // List of groups = header of the csv files
      const unitsNames     = Object.keys(data.players[i].unit_counts);
      const unitQuantities = Object.values(data.players[i].unit_counts);

      let stackedChartDataset = [];
      const maxTimeUnit = d3.max(unitQuantities.map(x => x.length));
      let timeUnit = 0;
      while (timeUnit < maxTimeUnit) {
        stackedChartDataset.push({});
        timeUnit++;
      }
      for (let i in stackedChartDataset) {
        for (let j in unitQuantities) {
          stackedChartDataset[i][unitsNames[j]] = unitQuantities[j][i];
        }
      }

      const series = d3.stack()
          .keys(unitsNames)
          (stackedChartDataset);

      const area = d3.area()
          .curve(d3.curveCardinal)
          .x( function (d,i) {
            return x(i);
          })
          .y0(function(d) {
            return y(d[0]);
          })
          .y1(function(d) {
            return y(d[1]);
          });

        areaChart
            .selectAll("path")
            .data(series)
            .enter()
            .append("path")
            .attr("d", area)
            .style("fill", (d, i) => color(i));
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
      .attr("y2", height)
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
    .data(uniq(data.units.map(u => u.category)))
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
        interaction(i, d3.event)
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
        
        let xTranslation = event.screenX - tooltip.width - tooltip.spacing;
        let yTranslation = event.screenY - 100;
        
        if (window.innerWidth - event.screenX > tooltip.width + tooltip.spacing + 20) {
          xTranslation = event.screenX + tooltip.spacing 
        }

        if (window.innerHeight + 100 - event.screenY < tooltipHeight) {
          yTranslation = event.screenY - 100 - tooltipHeight
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
        .attr("class", "")

      }
    }
    
  });

})();

/**
 * Generate random data (mocking purposes)
 * 
 * @param {*} duration 
 */
function generateRandomData(duration) {

  let units = [
    { id: 'probe', name: 'Probe', category: 'resource' },
    { id: 'zealot', name: 'Zealot', category: 'offensive' },
    { id: 'high-templar', name: 'High Templar', category: 'offensive' },
    { id: 'immortal', name: 'Immortal', category: 'offensive' },
    { id: 'chuck-norris', name: 'Chuck Norris', category: 'offensive' },
    { id: 'observer', name: 'Observer', category: 'scout' },
    { id: 'batman', name: 'Batman', category: 'scout' },
    { id: 'lorem', name: 'Lorem', category: 'flying' },
    { id: 'ipsum', name: 'Ipsum', category: 'flying' },
    { id: 'tempest', name: 'Tempest', category: 'flying' },
    { id: 'phoenix', name: 'Phoenix', category: 'flying' },
  ];

  data = {
    units: units,
    players: []
  };

  for (let i = 0; i < 2; i++) {

    data.players[i] = {
      unit_lifetimes: {},
      unit_counts: {}
    };

    units.forEach(u => {
      data.players[i].unit_lifetimes[u.id] = [];
      data.players[i].unit_counts[u.id] = [];

      // Generate unit lifetimes 
      for (let j = 0; j < numberBetween(1, 200); j++) {
        data.players[i].unit_lifetimes[u.id].push(generateRange(0, duration))
      }

      // Generate unit counts from unit_lifetimes
      for (let j = 0; j < duration; j++) {
        data.players[i].unit_counts[u.id].push(
          data.players[i].unit_lifetimes[u.id].filter(u => u[0] <= j && u[1] >= j).length
        )
      }
    })
  }

  return data
}

/** Capitalize */
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
};

/**
 * Generate a number between a and b
 * 
 * @param {*} a 
 * @param {*} b 
 */
function numberBetween(a, b) {
  return Math.floor(Math.random() * b) + a
}

/**
 * Generate a tupple of ordered numbers between a and b
 * 
 * @param {*} a 
 * @param {*} b 
 */
function generateRange(a, b) {
  let a_ = numberBetween(a, b);
  let b_ = numberBetween(a, b);

  if (a_ >= b_) {
    return [b_, a_]
  }
  return [a_, b_]
}

function getUnitFormNode(node) {
  let unitId = d3.select(node).node()[0].parentNode.parentNode.parentNode.getAttribute('data-unit-id');
  return data.units.filter(u => u.id === unitId)[0]
}

function uniq(a) {
  let seen = {};
  return a.filter(function(item) {
      return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  })
}