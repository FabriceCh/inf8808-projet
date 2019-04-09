class StackArea {

    constructor(data, width, color, hover, x) {

        this.probeId = 'Probe';
        this.showProbe = true;

        this.hover = hover;
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

        this.x = x;

        this.y = d3
        .scaleLinear()
        .range([this.contentHeight, 10]);

        this.area = d3.area()
        .x((d, i) => this.x(i))
        .y0((d) => this.y(d[0]))
        .y1((d) => this.y(d[1]));

        this.categories = uniq(data.units.map(u => u.category));

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
            .attr("width", this.x(data.duration) + this.column.gap)
            .attr("height", this.fullHeight)
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

        let header = this.svg.append("g")
        .attr("transform", `translate(${this.margin.left}, 0)`);

        header.append("rect")
        .attr("height", 30)
        .attr("width", 100)
        .attr("y", 10)
        .attr("rx", 4)
        .attr("ry", 4)
        .style("cursor", "pointer")
        .attr("fill", "#f1f1f1")
        .on("click", () => {
            if (this.showProbe) {
                header.select("text").text("Show Probes");
                header.select("rect").attr("width", 105);
            } else {
                header.select("text").text("Hide Probes");
                header.select("rect").attr("width", 100);
            }

            this.showProbe = !this.showProbe;

            this.redraw();
        });

        header.append("text")
        .attr("x", 10)
        .attr("y", 30)
        .attr("fill", "#333")
        .style("font-size", "0.9rem")
        .style("pointer-events", "none")
        .text("Hide Probes");
    }

    series(i) {
        let dataset = [];

        for (let j = 0; j < this.data.duration; j++) {
            let qty = {};
            this.categories.forEach(c => {
                qty[c] = this.data.units
                .filter(u => u.category === c)
                .filter(u => u.id !== 'Probe' || this.showProbe)
                .reduce((acc, u) => acc += this.data.players[i].unit_supplies[u.id][j], 0);
            });
            dataset.push(qty);
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
        this.domainY = d3.max(this.data.players, p => {
            let keys = Object.keys(p.unit_supplies).filter(k => k !== 'Probe' || this.showProbe);

            let values = [];

            for (let i = 0; i < this.data.duration; i++) {
                values.push(
                    keys.reduce((acc, key) => acc += p.unit_supplies[key][i], 0)
                );
            }

            return d3.max(values);
        });

        this.y = this.y.domain([0, this.domainY]);
    }
}
