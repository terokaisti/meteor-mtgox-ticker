Graph = function(elementId, data, width, height, intervalTime, maxPlots) {
	var self = this;

	this.data = data || [];
	this.w = width || 500;
	this.h = height || 300;
	this.intervalTime = intervalTime || 1000;
	this.maxPlots = maxPlots || 100;

	this.calculate_scales();

	this.vis = d3
		.select(elementId)
		.append("svg:svg")
		.attr("width", this.w)
		.attr("height", this.h)
		.append("svg:g");

	this.path = d3.svg.line()
		.x(function(d, i) {
			return self.x(i);
		})
		.y(function(d) {
			return self.y(d);
		})
		.interpolate("linear");


	this.vis.selectAll("path")
		.data([this.data])
		.enter()
		.append("svg:path")
		.attr("d", this.path);


		
};

Graph.prototype.calculate_scales = function() {
	this.x = d3
		.scale
		.linear()
		.domain([0, this.data.length - 1])
		.range([0, this.w]);
	this.y = d3
		.scale
		.linear()
		.domain([d3.min(this.data), d3.max(this.data)])
		.range([this.h, 0]);
};

Graph.prototype.redraw = function() {
	this.vis
		.selectAll("path")
		.data([this.data])
		.attr("transform", "translate(" + (this.x(1) - this.x(0)) + ")")
		.attr("d", this.path)
		.transition()
		.ease("linear")
		.duration(this.intervalTime)
		.attr("transform", "translate(0)");
		
};

Graph.prototype.add = function(value) {
	this.data.push(value);

	if (this.data.length > this.maxPlots) {
		this.data.shift();
	}

	this.calculate_scales();
	this.redraw();
};
