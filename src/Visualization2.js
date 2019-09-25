import React, {Component} from 'react';
import * as d3 from "d3";

class Visualization extends Component {

    constructor(props) {
        super(props);
        this.max = 0;
        this.pack = data => d3.pack()
            .size([700, 700])
            .padding(3)
            (d3.hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.rows - a.rows || b.value - a.value));
        this.color = d3.scaleOrdinal()
            .domain([1, this.max])
            .range(["#00FF00", "#7FFF00", "#FFFF00", "#FF7F00", "#FF0000"]);
    }

    componentDidMount() {
        let unnestedData = [];
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                this.max = file.children && (file.children.length > this.max) ? file.children.length : this.max;
                if (file.children)
                    for (let author of file.children) {
                        unnestedData.push({
                            layer: layer.name,
                            file: file.name,
                            issues: file.size,
                            mods: author.rows,
                            name: author.name
                        })
                    }
            }
        }
        let nestedData = d3.nest()
            .key(d => d.layer)
            .key(d => d.file)
            .rollup((leaves) => {
                return {
                    "issues": d3.max(leaves, d => d.issues),
                    "mods": d3.sum(leaves, d => d.mods),
                    "authors": d3.sum(leaves, d => 1)
                }
            })
            .entries(unnestedData);
        console.log(nestedData);
        nestedData = nestedData.map(nested => ({
            name: nested.key,
            children: nested.values.map(o => ({
                name: o.key,
                value: o.value.mods,
                issues: o.value.issues,
                authors: o.value.authors

            }))
        }));

        nestedData = {name: this.props.projectData.value.name, children: nestedData};
        console.log(nestedData);

        const root = this.pack(nestedData);
        let focus = root;
        let view;
        const width = this.props.width || 700,
            height = this.props.height || 700;

        const svg = d3.select(this.svg)
            .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .style("display", "block")
            .style("margin", "0 -14px")
            .style("background", "#eeeeee")
            .style("cursor", "pointer")
            .on("click", () => zoom(root));

        const node = svg.append("g")
            .selectAll("circle")
            .data(root.descendants().slice(1))
            .join("circle")
            .attr("fill", d => (!d.depth || !d.data.value) ? "#6e6e6e" : this.color(d.data.authors))
            .attr("pointer-events", d => !d.children ? "none" : null)
            .on("mouseover", function () {
                d3.select(this).attr("stroke", "#000");
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", null);
            })
            .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

        const label = svg.append("g")
            .style("font", "10px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants())
            .join("text")
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            .style("display", d => d.parent === root ? "inline" : "none")
            .text(d => d.data.name);

        zoomTo([root.x, root.y, root.r * 2]);

        function zoomTo(v) {
            const k = width / v[2];

            view = v;

            label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("r", d => d.r * k);
        }

        function zoom(d) {
            focus = d;

            const transition = svg.transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .tween("zoom", d => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => zoomTo(i(t));
                });

            label
                .filter(function (d) {
                    return d.parent === focus || this.style.display === "inline";
                })
                .transition(transition)
                .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                .on("start", function (d) {
                    if (d.parent === focus) this.style.display = "inline";
                })
                .on("end", function (d) {
                    if (d.parent !== focus) this.style.display = "none";
                });
        }

        return svg.node();
    }


    render() {
        return (
            <svg width={700} height={700}
                 ref={(svg) => {
                     this.svg = svg;
                 }}>
            </svg>
        )
    }
}

export default Visualization;