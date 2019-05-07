import React, {Component} from 'react';
import * as d3 from "d3";

class Visualization extends Component {
    componentDidMount() {
        const width = this.props.width || 960,
            height = this.props.height || 500;
        let svg = d3.select(this.svg)
                .attr('width', width)
                .attr('height', height),
            diameter = +svg.attr("width"),
            g = svg.append("g").attr("transform", "translate(2,2)");
        const pack = d3.pack()
            .size([diameter - 4, diameter - 4]);
        const root2 = d3.hierarchy(this.props.projectData.value)
            .sum(function (d) {
                return d.size;
            })
            .sort(function (a, b) {
                return b.value - a.value;
            });
        let node = g.selectAll(".node")
            .data(pack(root2).descendants())
            .enter().append("g")
            .attr("class", function (d) {
                return d.children ? "node" : "leaf node";
            })
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        node.append("title")
            .text(function (d) {
                return d.data.name;
            });
        node.append("circle")
            .attr("r", function (d) {
                return d.r;
            });

        node.filter(function (d) {
            return !d.children;
        }).style("fill", function (d) {
            return d.data.color;
        }).append("text")
            .attr("dy", "0.3em")
            .attr("font-size", "smaller")
            .text(function (d) {
                return d.data.name.substring(0, d.r / 3);
            })
            .style("fill", "black");
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