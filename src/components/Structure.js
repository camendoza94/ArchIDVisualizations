import React, {Component, Fragment} from 'react';
import * as d3 from "d3";
import Select from "react-select";

class Structure extends Component {

    constructor(props) {
        super(props);
        this.max = 0;
        this.state = {};
        this.pack = data => d3.pack()
            .size([700, 700])
            .padding(3)
            (d3.hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.rows - a.rows || b.value - a.value));
        this.handleChange = this.handleChange.bind(this);
        this.resetDeps = this.resetDeps.bind(this);
        this.isDisabled = this.isDisabled.bind(this);
        this.handleCheckboxes = this.handleCheckboxes.bind(this);
        this.checked = this.checked.bind(this);
    }

    componentDidMount() {
        let unnestedData = [];
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                if (file.children) {
                    let parts = file.path.split("/");
                    for (let author of file.children) {
                        unnestedData.push({
                            layer: layer.name,
                            file: file.name,
                            package: parts[parts.length - 2],
                            module: file.module,
                            issues: file.issues.reduce((a, b) => a + b, 0),
                            mods: author.rows,
                            name: author.name,
                            inDeps: file.inDeps,
                            outDeps: file.outDeps,
                            authors: file.children.length,
                            dependencies: file.inDeps.length + file.outDeps.length
                        })
                    }
                }
            }
        }
        const options = [
            {value: "package", label: "package"},
            {value: "layer", label: "layer"},
            {value: "module", label: "module"}
        ];
        const metrics = ["mods", "authors", "issues", "dependencies"];
        this.setState({
            options,
            currentKey: options[0],
            metrics,
            currentMetrics: [0, 1],
            data: unnestedData
        }, this.createSVG);
    }

    createSVG() {
        if (this.state.currentMetrics.length !== 2)
            return;
        let nestedData = d3.nest()
            .key(d => d[this.state.currentKey.label])
            .key(d => d.file)
            .rollup((leaves) => {
                return {
                    "issues": d3.max(leaves, d => d.issues),
                    "mods": d3.sum(leaves, d => d.mods),
                    "authors": d3.max(leaves, d => d.authors),
                    "inDeps": leaves[0].inDeps,
                    "outDeps": leaves[0].outDeps,
                    "dependencies": leaves[0].dependencies
                }
            })
            .entries(this.state.data);
        this.max = 0;
        nestedData = nestedData.map(nested => ({
            name: nested.key,
            children: nested.values.map(o => {
                this.max = o.value[this.state.metrics[this.state.currentMetrics[1]]] > this.max ? o.value[this.state.metrics[this.state.currentMetrics[1]]] : this.max;
                return {
                    name: o.key,
                    value: o.value[this.state.metrics[this.state.currentMetrics[0]]] + 0.1,
                    mods: o.value.mods,
                    issues: o.value.issues,
                    authors: o.value.authors,
                    inDeps: o.value.inDeps,
                    outDeps: o.value.outDeps,
                    dependencies: o.value.dependencies

                }
            })
        }));
        nestedData = {name: this.props.projectData.value.name, children: nestedData};
        this.color = d3.scaleQuantize()
            .domain([1, this.max])
            .range(["green", "yellow", "red"]);
        const root = this.pack(nestedData);
        let focus = root;
        let view;
        const width = this.props.width || 700,
            height = this.props.height || 700;

        const svg = d3.select(this.svg);
        svg.selectAll("*").remove();
        svg.attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .style("display", "block")
            .style("margin", "0 -14px")
            .style("background", "#eeeeee")
            .style("cursor", "pointer")
            .on("click", () => zoom(root));

        const node = svg.append("g")
            .selectAll("circle")
            .data(root.descendants().slice(1))
            .join("circle")
            .attr("fill", d => !d.depth ? "#6e6e6e" : this.color(d.data[this.state.metrics[this.state.currentMetrics[1]]]))
            .attr("fill-opacity", d => d.value === 0 ? 0 : 0.25)
            .attr("display", d => d.value === 0 ? "none" : "inline")
            .attr("stroke", d => d.value === 0 ? null : "#1F77B4")
            .on("mouseover", function (d) {
                if (d.value !== 0) d3.select(this).attr("stroke", "#000");
            })
            .on("mouseout", function (d) {
                if (d.value !== 0) d3.select(this).attr("stroke", "#1F77B4");
            })
            .on("click", d => {
                let zoomTo = d.depth === 2 ? d.parent : d;
                if (d.depth === 2 && focus === d.parent && !this.state.showing) {
                    this.setState({showing: d});
                    showDependencies(d);
                }
                if (focus !== zoomTo) {
                    zoom(zoomTo);
                    d3.event.stopPropagation()
                }
            });

        const label = svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .selectAll("text")
            .data(root.descendants())
            .join("text")
            .style("fill-opacity", d => d.depth === 1 ? 0.7 : 1)
            .style("display", d => d.parent === root && d.value !== 0 ? "inline" : "none")
            .style("font", d => d.depth === 1 ? "24px sans-serif" : "10px sans-serif")
            .style("fill", d => d.depth === 1 ? "#555555" : null)
            .style("font-weight", d => d.depth === 1 ? "bold" : null)
            .text(d => d.data.name);

        let first = `0 - ${Math.ceil(this.max / 3)} ${this.state.metrics[this.state.currentMetrics[1]]}`;
        let second = `${Math.ceil(this.max / 3 + 1)} - ${Math.floor(this.max * 2 / 3)} ${this.state.metrics[this.state.currentMetrics[1]]}`;
        let third = ` ${Math.floor(this.max * 2 / 3 + 1)} - ${this.max} ${this.state.metrics[this.state.currentMetrics[1]]}`;

        const legend = svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data([first, second, third])
            .join("g")
            .attr("transform", function (d, i) {
                return "translate(-50," + (-350 + (i * 20)) + ")";
            });

        const margin = {right: 60, left: 300};
        const iwidth = width - margin.left - margin.right;

        legend.append("rect")
            .attr("class", "legend")
            .attr("x", iwidth - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", (d, i) => this.color(i * this.max / 3 + 1));
        legend.append("text")
            .attr("x", iwidth - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(d => d);

        zoomTo([root.x, root.y, root.r * 2]);

        function showDependencies(d) {
            legend.selectAll("*").remove();
            const legend2 = svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "end")
                .selectAll("g")
                .data(["OutDependencies", "InDependencies"])
                .join("g")
                .attr("transform", function (d, i) {
                    return "translate(-50," + (-350 + (i * 20)) + ")";
                });
            legend2.append("rect")
                .attr("class", "legend")
                .attr("x", iwidth - 19)
                .attr("width", 19)
                .attr("height", 19)
                .attr("fill", (d, i) => i === 0 ? "blue" : "purple");
            legend2.append("text")
                .attr("x", iwidth - 24)
                .attr("y", 9.5)
                .attr("dy", "0.32em")
                .text(d => d);

            node.filter(function (d1) {
                return d.data.inDeps.find(i => {
                        let name = i.split("/")[i.split("/").length - 1];
                        return d1.data.name === name
                    }
                )
            })
                .attr("fill", "purple");

            node.filter(function (d1) {
                return d.data.outDeps.find(i => {
                        let name = i.split("/")[i.split("/").length - 1];
                        return d1.data.name === name
                    }
                )
            })
                .attr("fill", "blue");

            node.filter(function (d1) {
                return !(d.data.outDeps.find(i => {
                        let name = i.split("/")[i.split("/").length - 1];
                        return d1.data.name === name
                    }
                ) || d.data.inDeps.find(i => {
                        let name = i.split("/")[i.split("/").length - 1];
                        return d1.data.name === name
                    }
                ) || d1 === d)
            })
                .attr("fill", "white");
        }

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
                .tween("zoom", () => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => zoomTo(i(t));
                });

            label.filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            })
                .transition(transition)
                .style("fill-opacity", d => d.parent === focus ? d.depth === 1 ? 0.7 : 1 : 0)
                .on("start", function (d) {
                    if (d.parent === focus && d.value !== 0) this.style.display = "inline";
                })
                .on("end", function (d) {
                    if (d.parent !== focus) this.style.display = "none";
                });
        }

        return svg.node();
    }

    handleChange(currentKey) {
        this.setState({currentKey}, this.createSVG)
    }

    resetDeps() {
        this.setState({showing: null}, this.createSVG)
    }

    isDisabled(index) {
        return this.state.currentMetrics.length > 1 && this.state.currentMetrics.indexOf(index) === -1
    }

    checked(index) {
        return this.state.currentMetrics.indexOf(index) !== -1
    }

    handleCheckboxes(event, index) {
        let currentMetrics = this.state.currentMetrics;
        const i = currentMetrics.indexOf(index);
        if (i === -1 && currentMetrics.length < 2)
            currentMetrics.push(index);
        else
            currentMetrics.splice(i, 1);
        this.setState({currentMetrics}, this.createSVG)
    }

    render() {
        const {currentKey, options, metrics, currentMetrics} = this.state;
        return (
            <div>
                {options ?
                    <div className="row">
                        <h4 className="col-md-2">Key</h4>
                        <div className="col-md-6">
                            <Select
                                value={currentKey}
                                onChange={this.handleChange}
                                options={options}
                                defaultValue={options[0]}
                            />
                        </div>
                    </div> : ""}
                {metrics && currentMetrics ?
                    <Fragment>
                        <div className="row">
                            <h4 className="col-md-2">Metrics</h4>
                            {metrics.map((m, i) => {
                                return (
                                    <div key={"metric" + i} className="col-md-2">
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="checkbox"
                                                   id={"inlineCheckbox" + i}
                                                   value={"option" + i}
                                                   disabled={this.isDisabled(i)}
                                                   checked={this.checked(i)}
                                                   onChange={e => this.handleCheckboxes(e, i)}/>
                                            <label className="form-check-label"
                                                   htmlFor={"inlineCheckbox" + i}>{m}</label>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Fragment> : ""}
                {currentMetrics && currentMetrics.length === 2 ?
                    <p>{`Circle size is proportional to number of ${metrics[currentMetrics[0]]} on a given file`}<br/>
                        {`Color corresponds to number of ${metrics[currentMetrics[1]]} on a given file`}</p> : ""}
                <button type="button" className="btn btn-outline-warning" onClick={this.resetDeps}>Reset dependencies
                </button>
                <svg width={700} height={700}
                     ref={(svg) => {
                         this.svg = svg;
                     }}>
                </svg>
            </div>
        )
    }
}

export default Structure;