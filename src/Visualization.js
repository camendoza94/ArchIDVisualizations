import React, {Component} from 'react';
import * as d3 from "d3";


class Visualization extends Component {

    constructor(props) {
        super(props);
        this.max = 0;
        this.partition = data => d3.partition()
            .size([500, 900])
            .padding(1)
            (d3.hierarchy(data)
                .sum(d => d.rows)
                .sort((a, b) => b.rows - a.rows || b.value - a.value));
        this.color = d3.scaleOrdinal()
            .domain(new Array(this.max))
            .range(["#00FF00", "#7FFF00", "#FFFF00", "#FF7F00", "#FF0000"]);
    }

    componentDidMount() {
        this.max = Math.max(...[].concat.apply([], this.props.projectData.value.children.map(l => l.children)).map(f => f.size));
        const width = this.props.width || 900,
            height = this.props.height || 500;
        const root = this.partition(this.props.projectData.value);

        const svg = d3.select(this.svg)
            .attr("viewBox", [0, 0, width, height])
            .style("font", "10px sans-serif");

        const cell = svg
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.y0},${d.x0})`);

        cell.append("rect")
            .attr("width", d => d.y1 - d.y0)
            .attr("height", d => d.x1 - d.x0)
            .attr("fill-opacity", 0.6)
            .attr("fill", d => {
                if (!d.depth || !d.data.size) return "#ccc";
                return this.color(d.data.size - 1);
            });

        const text = cell.filter(d => (d.x1 - d.x0) > 10).append("text")
            .attr("x", d => (d.y1 - d.y0) / 2)
            .attr("y", d => (d.x1 - d.x0) / 2);

        text.append("tspan")
            .text(d => d.data.name);

        text.append("tspan")
            .attr("fill-opacity", 0.7)
            .text(d => ` ${d.data.size || ''}`);

        cell.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\nRow mods: ${d.value}`);

        return svg.node();
    }

    render() {
        return (
            <svg
                ref={(svg) => {
                    this.svg = svg;
                }}>
            </svg>
        )
    }
}

export default Visualization;