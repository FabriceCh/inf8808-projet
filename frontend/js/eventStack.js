class EventStack {

  constructor(data, width, color, hover, x, brushUpdate) {
    this.hover = hover;
    this.data = data;

    this.aggr = 2;

    this.margin = {
      top: 26,
      left: 0,
      right: 0,
      bottom: 0
    };

    this.padding = {
      top: 10,
      bottom: 10,
      left: 0,
      right: 0
    };

    this.column = {
      gap: 20
    };

    this.width = width;
    this.fullHeight = 200;
    this.height = this.fullHeight - this.margin.top - this.margin.bottom;
    this.contentHeight = this.height - this.padding.top - this.padding.bottom;

    this.color = color;

    this.x = x.copy();
    this.x.domain([0, data.duration/this.aggr]).range([0,this.width/2 - this.column.gap/2]);

    this.y = d3
    .scaleLinear()
    .range([this.contentHeight, 10]);

    this.area = d3.area()
    .curve(d3.curveCatmullRom.alpha(0.5))
    .x((d, i) => {
      return this.x(i)
    })
    .y0((d) => this.y(d[0]))
    .y1((d) => this.y(d[1]));

    this.categories = ['camera', 'selection', 'commands'];

    // Select new SVG
    this.svg = d3.select("#aggregation").attr("height", this.fullHeight);
    this.createDefs(this.svg);

    // Create base group
    this.g = this.svg
    .append("g")
    .attr("transform", `translate(${this.margin.left} ${this.margin.top})`);

    /*
     * brushes
     */
    let currentBrush = null;
    let brush = d3.brushX().extent([[0, 0], [x(data.duration), this.height]])
    .on("start", function(d, i, nodes) {
      currentBrush = nodes[0];
    })
    .on("end", brushUpdate)
    .on("brush", brushUpdate);

    // Array containing stack area paths for each player
    this.areaCharts = [];

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
      let content = this.g.append("g")
      .attr("transform", () => `translate(${i * (this.width / 2)},0)`)
      .call(this.hover, this.x);
        
      /*
      |--------------------------------------------------------------------------
      | Row : Player : White Rectangle for interaction
      |--------------------------------------------------------------------------
      */

      content.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.x(data.duration/this.aggr + this.column.gap))
      .attr("height", this.fullHeight)
      .attr("fill", "none");

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Group for drawing
      |--------------------------------------------------------------------------
      */

      let player = content.append("g")
      .attr("transform", () => `translate(0,${this.padding.top})`);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : Background Rectangles
      |--------------------------------------------------------------------------
      */

      player.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.x(data.duration/this.aggr))
      .attr("height", this.contentHeight)
      .attr("fill", "#fff")
      .style("filter", "url(#drop-shadow)");

      /*
      |--------------------------------------------------------------------------
      | Area Chart for each player
      |--------------------------------------------------------------------------
      */

      this.areaCharts.push(
          player.append("g").attr("class", `area-chart-${i}`)
      );

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
      .attr("y2", this.contentHeight)
      .attr("stroke", "#000")
      .attr("display", "none");

      /*
        |--------------------------------------------------------------------------
        | Row : Left Text
        |--------------------------------------------------------------------------
        */

       content.append("text")
       .attr("text-anchor", "start")
       .attr("x", 10)
       .attr("y", -this.margin.top + 10)
       .attr("style", "font-weight: 600")
       .text("All events")
       .attr("fill", "#333")
       .attr("alignment-baseline", "hanging");

      /*
      |--------------------------------------------------------------------------
      | Row : Player : brushing
      |--------------------------------------------------------------------------
      */
      
      player.append("g")
      .attr("id", `brush_${i}`)
      .attr("class", "x brush")
      .call(brush);
    }

    this.draw();
  }

  series(i) {
    
    let dataset = [];
    
    for (let j = 0; j < this.data.duration / this.aggr; j++) {
      let qty = {};
      this.categories.forEach(c => {
        qty[c] = 0;
        for (let k = 0; k < this.aggr; k++) {
          qty[c] += this.data.players[i].apms[c][k * j] ;
        }
      });

      dataset.push(qty);
    }
    
    return d3.stack()
    .keys(this.categories)
    (dataset);
  }

  draw() {
    this.updateY();
    this.areaCharts.forEach((areaChart, i) => {

      let series = this.series(i);

      areaChart
      .selectAll("path")
      .data(series)
      .enter()
      .append("path")
      .attr("d", this.area)
      .attr("stroke-width", 0)
      .style("fill", d => this.color(d.key));
    });
  }

  redraw() {
    this.updateY();
    this.areaCharts.forEach((areaChart, i) => {

      let series = this.series(i);

      areaChart
      .selectAll("path")
      .data(series)
      .transition()
      .attr("d", this.area);
    });
  }

  updateY() {
    this.domainY = d3.max(
      this.data.players.map(player => {
        let max = 0;

        for (let j = 0; j < this.data.duration / this.aggr; j++) {
          let qty = 0;
          this.categories.forEach(c => {
            for (let k = 0; k < this.aggr; k++) {
              qty += player.apms[c][k * j];
            }

            if (qty > max) {
              max = qty;
            }
          });
        }
          
        return max;
      })
    );
    this.y = this.y.domain([0, this.domainY]);
  }

  createDefs(svg) {
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
      .attr("dx", 1)
      .attr("dy", 1);
  
    filter.append("feComponentTransfer")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.1);
  
    // overlay original SourceGraphic over translated blurred opacity by using
    // feMerge filter. Order of specifying inputs is important!
    var feMerge = filter.append("feMerge");
  
    feMerge.append("feMergeNode")
      .attr("in", "offsetBlur")
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
  }
}
