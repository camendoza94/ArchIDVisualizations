import React, {Component} from 'react';
import * as d3 from "d3";


class Visualization extends Component {

    constructor(props) {
        super(props);
        this.partition = data => d3.partition()
            .size([2500, 900])
            .padding(1)
            (d3.hierarchy(data)
                .sum(d => d.size)
                .sort((a, b) => b.size - a.size));

        this.color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.props.projectData.value.children.length + 1));
    }

    componentDidMount() {
        const width = this.props.width || 900,
            height = this.props.height || 2500;
        console.log(this.props.projectData.value);
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
            .attr("height", d => {
                return d.depth === 3 ? (d.parent.x1- d.parent.x0)/5: d.x1 - d.x0})
            .attr("fill-opacity", 0.6)
            .attr("fill", d => {
                if (!d.depth) return "#ccc";
                while (d.depth > 1) d = d.parent;
                return this.color(d.data.name);
            });

        const text = cell.filter(d => (d.x1 - d.x0) > 10).append("text")
            .attr("x", d => (d.y1 - d.y0) / 2)
            .attr("y", d => (d.x1 - d.x0) / 2);

        text.append("tspan")
            .text(d => d.data.name);

        text.append("tspan")
            .attr("fill-opacity", 0.7)
            .text(d => ` ${d.value}`);

        cell.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${d.value}`);

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