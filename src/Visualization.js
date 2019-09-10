import React, {Component} from 'react';
import * as d3 from "d3";
import Select from "react-select";
import Slider from 'rc-slider';
const Range = Slider.Range;

class Visualization extends Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.max = 0;
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        this.max = 0;
        let unnestedData = [];
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                this.max = file.size > this.max ? file.size : this.max;
                unnestedData.push({
                    layer: layer.name,
                    issues: file.size,
                    mods: file.children ? file.children.map(a => a.rows).reduce((a, b) => a + b, 0) : 0,
                    name: file.name
                })

            }
        }
        const options = d3.keys(unnestedData[0]).map(key => {
                return {value: key, label: key}
            }
        );
        this.setState({options, currentKey: options[0], data: unnestedData}, this.createSVG);
    }

    createSVG() {
        const height = 550;
        const width = 1000;
        let columns = d3.keys(this.state.data[0]).filter(d => d !== this.state.currentKey.label && !isNaN(this.state.data[0][d])).slice(0, 2); // TODO Max Number of Columns
        let coefficients = [100, 50, 100]; //TODO sliders
        let scales = columns.map((col, i) =>
            d3.scaleLinear()
                .domain([0, d3.max(this.state.data, e => e[col])])
                .range([0, coefficients[i]]));

        let adjustedData = this.state.data.map((d) => {
            const ret = {};
            ret[this.state.currentKey.label] = d[this.state.currentKey.label];
            ret._total = 0;
            columns
                .forEach((col, i) => {
                    ret[col] = scales[i](d[col]);
                    ret._total += ret[col];
                }); // adjust the values by the coefficient

            return ret;
        }).sort((a, b) => d3.descending(a._total, b._total)).slice(0, 30); //TODO Max number of rows

        let stackedData = d3.stack()
            .keys(columns)
            (adjustedData);
        console.log(adjustedData);
        console.log(stackedData);
        const svg = d3.select(this.svg);
        svg.selectAll("*").remove();
        svg.attr("width", width)
            .attr("height", height);
        const margin = {top: 20, right: 60, bottom: 30, left: 200};
        const iwidth = width - margin.left - margin.right;
        const iheight = height - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let y = d3.scaleBand()
            .rangeRound([0, iheight])
            .padding(0.1);

        let x = d3.scaleLinear()
            .rangeRound([0, iwidth]);

        let z = d3.scaleOrdinal(d3.schemeDark2);

        x.domain([0, columns.length * 100]);
        y.domain(adjustedData.map(d => d[this.state.currentKey.label]));
        z.domain([0, columns.length]);

        g.append("g")
            .selectAll("g")
            .data(stackedData)
            .join("g")
            .attr("fill", d => z(d.key))
            .attr("stroke", "white")
            .selectAll("rect")
            .data(d => d)
            .join(enter => enter.append("rect")
                    .attr("x", d => x(d[0]))
                    .attr("width", (d) => x(d[1]) - x(d[0]))
                    .attr("y", (d) => y(d.data[this.state.currentKey.label]))
                    .attr("height", y.bandwidth()),
                update => update
                    .transition().duration(1500)
                    .attr("x", d => x(d[0]))
                    .attr("width", (d) => x(d[1]) - x(d[0]))
                    .attr("y", (d) => y(d.data.name))
            );

        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(null, "s"))
            .call(axis => axis.selectAll("text").style("font-size", `${iheight / adjustedData.length * 0.7}pt`))
            .append("text")
            .attr("x", 2)
            .attr("y", iheight)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .text("Combined index");

        let legend = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(columns)
            .join("g")
            .attr("transform", function (d, i) {
                return "translate(-50," + i * 20 + ")";
            });

        legend.append("rect")
            .attr("x", iwidth - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z);

        legend.append("text")
            .attr("x", iwidth - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(d => d);
        return svg.node();
    }

    handleChange(currentKey) {
        this.setState({currentKey}, this.createSVG)
    }

    render() {
        const {currentKey, options} = this.state;
        return (
            <div>
                {options ?
                    <Select
                        value={currentKey}
                        onChange={this.handleChange}
                        options={options}
                        defaultValue={options[0]}
                    /> : ''}
                <svg
                    ref={(svg) => {
                        this.svg = svg;
                    }}>
                </svg>
            </div>
        )
    }
}

export default Visualization;