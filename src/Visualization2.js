import React, {Component} from 'react';
import * as d3 from "d3";


class Visualization2 extends Component {

    constructor(props) {
        super(props);
        this.max = 0;
        this.partition = data => d3.partition()
            .size([900, 900])
            .padding(1)
            (d3.hierarchy(data)
                .sum(d => d.mods)
                .sort((a, b) => b.mods - a.mods || b.value - a.value));
        this.color = d3.scaleOrdinal()
            .domain([1, this.max])
            .range(["#00FF00", "#7FFF00", "#FFFF00", "#FF7F00", "#FF0000"]);
    }

    componentDidMount() {
        this.max = Math.max(...[].concat.apply([], this.props.projectData.value.children.map(l => l.children)).map(f => f.size));
        const width = this.props.width || 900,
            height = this.props.height || 900;
        let unnestedData = [];
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                if (file.children)
                    for (let author of file.children) {
                        unnestedData.push({
                            layer: layer.name,
                            file: file.name,
                            issues: author.size,
                            mods: author.rows,
                            name: author.name
                        })
                    }
            }
        }
        let nestedData = d3.nest()
            .key(d => d.name)
            .key(d => d.layer)
            .key(d => d.file)
            .rollup((leaves) => {
                return {"issues": d3.sum(leaves, d => d.issues), "mods": d3.sum(leaves, d => d.mods)}
            })
            .entries(unnestedData);
        nestedData = nestedData.map(nested => ({
            name: nested.key,
            children: nested.values.map(o => ({
                name: o.key,
                children: o.values.map(f => ({name: f.key, size: f.value.issues, mods: f.value.mods}))
            }))
        }));
        nestedData = {name: this.props.projectData.value.name, children: nestedData};
        console.log(nestedData);
        //TODO Add zoomable
        const root = this.partition(nestedData);
        this.wScale = d3.scaleLinear()
            .domain([0, d3.max(root.descendants(), d => d.data.size)])
            .range([0, root.y1 - root.y0]);
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
            .attr("fill", "#eeee")
            .attr("stroke", "#ccc");

        cell.append("rect")
            .attr("width", d => this.wScale(d.data.size))
            .attr("height", d => d.x1 - d.x0)
            .attr("fill-opacity", 0.6)
            .attr("fill", d => {
                if (!d.depth || !d.data.size) return "#6e6e6e";
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
        console.log(root.descendants());
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

export default Visualization2;