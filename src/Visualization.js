import React, {Component} from 'react';
import * as d3 from "d3";


class Visualization extends Component {

    constructor(props) {
        super(props);
        this.max = 0;
        this.partition = data => d3.partition()
            .size([600, 1300])
            .padding(1)
            (d3.hierarchy(data)
                .sum(d => d.rows)
                .sort((a, b) => b.rows - a.rows || b.value - a.value));
        this.color = d3.scaleOrdinal()
            .domain([1, this.max])
            .range(["#00FF00", "#7FFF00", "#FFFF00", "#FF7F00", "#FF0000"]);
    }

    componentDidMount() {
        this.max = Math.max(...[].concat.apply([], this.props.projectData.value.children.map(l => l.children)).map(f => f.size));
        const width = this.props.width || 1300,
            height = this.props.height || 600;

        const root = this.partition(this.props.projectData.value);

        this.wScale = d3.scaleLinear()
            .domain([0, d3.max(root.descendants(), d => d.data.size)])
            .range([0, root.y1 - root.y0]);

        let focus = root;

        const svg = d3.select(this.svg)
            .attr("viewBox", [0, 0, width, height])
            .style("font", "10px sans-serif");

        const cell = svg
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", d => `translate(${d.y0},${d.x0})`);

        const rectbg = cell.append("rect")
            .attr("width", d => d.y1 - d.y0)
            .attr("height", d => rectHeight(d))
            .attr("fill", "#eeee")
            .attr("stroke", "#ccc")
            .style("cursor", "pointer")
            .on("click", clicked);

        const rect = cell.append("rect")
            .attr("width", d => this.wScale(d.data.size))
            .attr("height", d => rectHeight(d))
            .attr("fill-opacity", 0.6)
            .attr("fill", d => {
                if (!d.depth || !d.data.size) return "#6e6e6e";
                return this.color(d.data.size - 1);
            })
            .style("cursor", "pointer")
            .on("click", clicked);

        const text = cell.filter(d => (d.x1 - d.x0) > 10).append("text")
            .style("user-select", "none")
            .attr("pointer-events", "none")
            .attr("x", d => (d.y1 - d.y0) / 2)
            .attr("y", d => (d.x1 - d.x0) / 2)
            .attr("fill-opacity", d => +labelVisible(d));

        text.append("tspan")
            .text(d => d.data.name);

        const tspan = text.append("tspan")
            .attr("fill-opacity", d => labelVisible(d) * 0.7)
            .text(d => ` ${d.data.size || ''}`);

        cell.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\nRow mods: ${d.value}`);

        function clicked(p) {
            focus = focus === p ? p = p.parent : p;

            root.each(d => d.target = {
                x0: (d.x0 - p.x0) / (p.x1 - p.x0) * height,
                x1: (d.x1 - p.x0) / (p.x1 - p.x0) * height,
                y0: d.y0 - p.y0,
                y1: d.y1 - p.y0
            });

            const t = cell.transition().duration(750)
                .attr("transform", d => `translate(${d.target.y0},${d.target.x0})`);

            rect.transition(t).attr("height", d => rectHeight(d.target));
            rectbg.transition(t).attr("height", d => rectHeight(d.target));
            text.transition(t).attr("fill-opacity", d => +labelVisible(d.target));
            tspan.transition(t).attr("fill-opacity", d => labelVisible(d.target) * 0.7);
        }

        function rectHeight(d) {
            return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
        }

        function labelVisible(d) {
            return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
        }

        return svg.node();
    }

    render() {
        return (
            <svg width="1300px" height="600px"
                 ref={(svg) => {
                     this.svg = svg;
                 }}>
            </svg>
        )
    }
}

export default Visualization;