class EventStack {

  constructor(data, width, color, hover, x) {
    this.data = data;

    this.margin = {
      top: 0,
      left: 150,
      right: 0,
      bottom: 0
    };

    this.padding = {
      top: 50,
      bottom: 10,
      left: 0,
      right: 0
    };

    this.column = {
      gap: 10
    };

    this.width = width;
    this.fullHeight = 300;
    this.height = this.fullHeight - this.margin.top - this.margin.bottom;
    this.contentHeight = this.height - this.padding.top - this.padding.bottom;

    this.color = color;

    this.x = x.domain([0, data.duration]);

    this.y = d3
    .scaleLinear()
    .range([this.contentHeight, 10])
    .domain([0, 30]);

    this.area = d3.area()
    .curve(d3.curveCatmullRom.alpha(0.5))
    .x((d, i) => {
      return this.x(i)
    })
    .y0((d) => this.y(d[0]))
    .y1((d) => this.y(d[1]));

    this.categories = ['camera', 'commands', 'selection'];

    // Select new SVG
    this.svg = d3.select("#aggregation").attr("height", this.fullHeight);

    // Create base group
    this.g = this.svg
    .append("g")
    .attr("transform", `translate(${this.margin.left} ${this.margin.top})`);

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
      .attr("transform", () => `translate(${i * (this.width / 2)},0)`);
      // .call(this.hover, this.x);

      /*
      |--------------------------------------------------------------------------
      | Row : Player : White Rectangle for interaction
      |--------------------------------------------------------------------------
      */

      content.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.x(data.duration + this.column.gap))
      .attr("height", this.fullHeight)
      .attr("class", "white-rectangle")
      .attr("fill", "#fff");

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
      .attr("width", this.x(data.duration))
      .attr("height", this.contentHeight)
      .attr("fill", "#fff");

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
    }
    this.draw();
  }

  series(i) {
    let aggr = 12;
    let dataset = [];
    for (let j = 0; j < this.data.duration / aggr; j++) {
      let qty = {};
      this.categories.forEach(c => {
        qty[c] = 0;
        for (let k = 0; k < aggr; k++) {
          qty[c] += this.data.players[i].apms[c][k * j] / aggr;
        }
      });

      for (let k = 0; k < aggr; k++) {
        dataset.push(qty);
      }
    }
    console.log(dataset);
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
        this.data.players.map(
            player => d3.max(
                Object.values(player.apms).reduce( (acc, val) => acc + val)
            )
        )
    );
    this.y = this.y.domain([0, this.domainY]);
  }
}
