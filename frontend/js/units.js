(function () {
  "use strict";

  const filePath = "/datafiles/data.json";

  d3.json(filePath).then(function (data) {

    /*
    |--------------------------------------------------------------------------
    | Layout settings
    |--------------------------------------------------------------------------
    */

    let margin = {
      top: 50,
      left: 150,
      right: 0,
      bottom: 0
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
        top: 5,
        bottom: 5
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

    const fake = generateRandomData(game.duration);
    data.units = fake.units;

    // DEBUG
    console.log("real data:");
    console.log(data);
    console.log("fake data:");
    console.log(fake);

    const USE_FAKE_DATA = true;
    if (USE_FAKE_DATA) data = fake;


    /*
    |--------------------------------------------------------------------------
    | Preprocessing
    |--------------------------------------------------------------------------
    |
    | Once the data is received, metadata is added for layout/styling purposes
    |
    */
    
    // For each unit, the height and vertical offset is calculated
    // to correctly position the rows on the graph.
    let offset = 0;

    data.units = data.units.map(u => {
      u.offset = offset;
      u.height = Math.max(
          d3.max(data.players, p => {
            // console.log(u.id);
            // console.log(p);
            return p.unit_lifetimes[u.id] && p.unit_lifetimes[u.id].length || 0;
          }) * (line.height+line.gap) + row.margin.top + row.margin.bottom,
          50);
      offset += u.height;
      return u;
    });

    // Sort unit_lifetimes
    // console.log(data);
    data.players.forEach(p => {
      Object.keys(p.unit_lifetimes).forEach(key => {
        // if (!p.unit_lifetimes[key])
        // console.log(p.unit_lifetimes);
        p.unit_lifetimes[key] = p.unit_lifetimes[key].sort((a,b) => {
          return (a[0] > b[0]) ? 1 : -1;
        })
      })
    });

    /*
    |--------------------------------------------------------------------------
    | Dynamically set the height of the SVG with the calculated offset
    |--------------------------------------------------------------------------
    */

    let fullHeight = offset + margin.bottom + margin.top;
    let height = fullHeight;

    /*
    |--------------------------------------------------------------------------
    | Scales
    |--------------------------------------------------------------------------
    */

    // Color scale (based on the unit category)
    let color = d3.scaleOrdinal()
    .domain(uniq(data.units.map(u => u.category)))
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

    let svg = d3
    .select("#viz")
    .attr("height", fullHeight)
    .attr("class", "tutorial");

    let g = svg
      .append("g")
      .attr("transform", `translate(${margin.left} ${margin.top})`);

    createDefs(svg);

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
    .attr("class", (d,i) => `group group-${i}`)
    .attr("data-unit-id", d => d.id)
    .attr("transform", d => `translate(0,${d.offset})`);

    /*
    |--------------------------------------------------------------------------
    | Row : Left Text
    |--------------------------------------------------------------------------
    */

    rows.append("text")
    .attr("x", -margin.left + 40)
    .attr("y", 5)
    .attr("style", "font-weight: 600")
    .text(d => d.name)
    .attr("fill", d => color(d.category))
    .attr("alignment-baseline", "hanging");

    /*
    |--------------------------------------------------------------------------
    | Row : Left Icon
    |--------------------------------------------------------------------------
    */

    rows.append("svg:image")
    .attr("x", -margin.left)
    .attr("y", 0)
    .attr("width", 30)
    .attr("xlink:href", d => `/img/icons/${d.id}.png`);

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
      .attr("width", x(game.duration) + column.gap)
      .attr("height", d => d.height)
      .attr("fill", "#fff");

      player.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", x(game.duration))
      .attr("height", d => d.height - row.margin.top - row.margin.bottom)
      .attr("fill", d => color(d.category))
      .attr("opacity", "0.1");

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Lifetime lines
      |--------------------------------------------------------------------------
      */

      player.append("g")
      .attr("class", `player-row-${i}`)
      .selectAll(".line")
      .data(d => data.players[i].unit_lifetimes[d.id])
      .enter()
      .append("line")
      .attr("class", (d,i) => `lifetime lifetime-${i}`)
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
      .attr("y2", d => d.height - row.margin.top - row.margin.bottom)
      .attr("stroke", "#000")
      .attr("display", "none")

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

    for (let i = 0; i < data.players.length; i++) {

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
      .attr("width", x(game.duration) + column.gap)
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
      .attr("width", x(game.duration))
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
      x.domain([0, data.players[i].unit_counts[Object.keys(data.players[i].unit_counts)[0]].length]);

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
      .attr("y2", contentHeight)
      .attr("stroke", "#000")
      .attr("display", "none")
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Tutorial Elements
    |--------------------------------------------------------------------------
    */

    let numberOfLines = g.selectAll(".group-0 .player-row-0 .lifetime")._groups[0].length;
    let highlightedLine = g.select(`.group-0 .player-row-0 .lifetime-${parseInt(numberOfLines/2)}`);

    let tuto = g.append("g")
    .attr("class", "tutorial")
    .attr("transform", `translate(${highlightedLine.attr("x1")},${parseInt(highlightedLine.attr("y1")) + 30})`)
    .style("opacity", "0");

    let tutoHeight = 142;
    let tutoWidth = 300;
    let tutoMargin = {
      top: 25,
      left: 20,
      right: 20,
      bottom: 25
    }
    let tutoTextHeight = 60

    tuto.append("svg:image")
    .attr("x", tutoWidth / 2)
    .attr("y", -tutoMargin.top)
    .attr("width", 20)
    .attr("xlink:href", d => `/img/pointer.svg`);

    tuto.append("rect")
    .attr("class", "tutorial-box")
    .attr("height", tutoHeight)
    .attr("width", tutoWidth)
    .attr("fill", "#fff")
    .attr("rx", 4)
    .attr("ry", 4)
    .style("filter", "url(#drop-shadow)");

    tuto.append("text")
    .attr("y", tutoMargin.top)
    .attr("x", tutoMargin.left)
    .attr("style", "font-size: 0.9rem")
    .text(`One line represents the lifetime of a single unit in a game. This line shows the lifetime a of a ${data.units[0].name} from creation to death.`)
    .call(wrap, tutoWidth - tutoMargin.left - tutoMargin.right);

    tuto.append("rect")
    .attr("y", tutoTextHeight + 30)
    .attr("x", 20)
    .attr("width", 105)
    .attr("height", 35)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("style", "cursor: pointer;")
    .on("click", function(){
      g.selectAll(".lifetime")
      .attr("opacity", 1);
      tuto.transition()
      .style("opacity", 0);
    });

    tuto.append("text")
    .attr("y", tutoTextHeight + 53)
    .attr("x", 35)
    .attr("fill", "#fff")
    .attr("style", "font-size: 0.9rem; font-weight: 500; pointer-events: none;")
    .text("Ok, got it!");

    // Transitions

    tuto.transition()
    .delay(800)
    .duration(400)
    .style("opacity", "1");

    g.selectAll(".lifetime")
    .attr("opacity", "0.2");

    highlightedLine
    .transition()
    .delay(100)
    .attr("opacity", "1");

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

      if (time > game.duration) {
        // Hide tooltip
        d3.select("#tooltip")
        .attr("class", "");
      }
    }

    /**
     * Wrap Text
     * @param {*} text 
     * @param {*} width 
     */
    function wrap(text, width) {
      text.each(function () {
        var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          x = text.attr("x"),
          y = text.attr("y"),
          dy = 0, //parseFloat(text.attr("dy")),
          tspan = text.text(null)
                      .append("tspan")
                      .attr("x", x)
                      .attr("y", y)
                      .attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                        .text(word);
          }
        }
    });
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
    // { id: 'adept', name: 'Adept', category: 'resource' },
    // { id: 'archon', name: 'Archon', category: 'resource' },
    // { id: 'carrier', name: 'Carrier', category: 'resource' },
    // { id: 'colossus', name: 'Colossus', category: 'offensive' },
    // { id: 'dark-templar', name: 'Dark Templar', category: 'offensive' },
    // { id: 'disruptor', name: 'Disruptor', category: 'offensive' },
    // { id: 'high-templar', name: 'High Templar', category: 'offensive' },
    // { id: 'immortal', name: 'Immortal', category: 'offensive' },
    // { id: 'mothership', name: 'Mothership', category: 'scout' },
    // { id: 'observer', name: 'Observer', category: 'scout' },
    // { id: 'phoenix', name: 'Phoenix', category: 'flying' },
    // { id: 'probe', name: 'Probe', category: 'resource' },
    // { id: 'sentry', name: 'Sentry', category: 'flying' },
    // { id: 'stalker', name: 'Stalker', category: 'flying' },
    // { id: 'tempest', name: 'Tempest', category: 'flying' },
    // { id: 'void-ray', name: 'Void Ray', category: 'offensive' },
    // { id: 'warp-prism', name: 'Warp Prism', category: 'offensive' },
    // { id: 'zealot', name: 'Zealot', category: 'offensive' },

    { id: 'Adept', name: 'Adept', category: 'resource' },
    { id: 'Archon', name: 'Archon', category: 'resource' },
    { id: 'Carrier', name: 'Carrier', category: 'resource' },
    { id: 'Colossus', name: 'Colossus', category: 'offensive' },
    { id: 'DarkTemplar', name: 'Dark Templar', category: 'offensive' },
    { id: 'Disruptor', name: 'Disruptor', category: 'offensive' },
    { id: 'HighTemplar', name: 'High Templar', category: 'offensive' },
    { id: 'Immortal', name: 'Immortal', category: 'offensive' },
    { id: 'Mothership', name: 'Mothership', category: 'scout' },
    { id: 'Observer', name: 'Observer', category: 'scout' },
    { id: 'Phoenix', name: 'Phoenix', category: 'flying' },
    { id: 'Probe', name: 'Probe', category: 'resource' },
    { id: 'Sentry', name: 'Sentry', category: 'flying' },
    { id: 'Stalker', name: 'Stalker', category: 'flying' },
    { id: 'tempest', name: 'Tempest', category: 'flying' },
    { id: 'VoidRay', name: 'Void Ray', category: 'offensive' },
    { id: 'WarpPrism', name: 'Warp Prism', category: 'offensive' },
    { id: 'Zealot', name: 'Zealot', category: 'offensive' },
  ];

  units = units.sort((a,b) => {
    return (a.category > b.category) ? 1 : -1
  });

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

  return data;
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

function createDefs(svg) {
  // filters go in defs element
  var defs = svg.append("defs");

  // create filter with id #drop-shadow
  // height=130% so that the shadow is not clipped
  var filter = defs.append("filter")
    .attr("id", "drop-shadow")
    .attr("height", "130%");

  // SourceAlpha refers to opacity of graphic that this filter will be applied to
  // convolve that with a Gaussian with standard deviation 3 and store result
  // in blur
  filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 3);

  // translate output of Gaussian blur to the right and downwards with 2px
  // store result in offsetBlur
  filter.append("feOffset")
    .attr("dx", 3)
    .attr("dy", 3);

  filter.append("feComponentTransfer")
    .append("feFuncA")
    .attr("type", "linear")
    .attr("slope", 0.2);

  // overlay original SourceGraphic over translated blurred opacity by using
  // feMerge filter. Order of specifying inputs is important!
  var feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode")
    .attr("in", "offsetBlur")
  feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");
}