import React, {Component, Fragment} from 'react';
import * as d3 from "d3";
import Select from "react-select";
import IssueDetail from "./IssueDetail";
import {Link} from "react-router-dom";

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
        this.hideMinor = this.hideMinor.bind(this);
        this.handleAuthors = this.handleAuthors.bind(this);
    }

    componentDidMount() {
        let unnestedData = [];
        const commits = this.props.currentFiles.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const files = commits[commits.length - 1].files;
        const categorization = this.props.categorization;
        let rules = categorization.decisions.map(d => d.rules);
        rules = [].concat.apply([], rules).sort((a, b) => a.id - b.id);
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                if (file.children) {
                    let parts = file.path.split("/");
                    for (let author of file.children) {
                        unnestedData.push({
                            layer: layer.name,
                            file: file.name,
                            path: file.path,
                            package: parts[parts.length - 2],
                            module: file.module,
                            issuesDetail: file.issuesDetail.map(d => this.props.issues.find(i => i.id === d.id)),
                            majorIssues_by100LOC: parseFloat(Number(file.issues.reduce((a, b, i) => rules[i].severity !== "Minor" ? a + b : a, 0) * 100 / files.find(f => file.name === f.name.split("/")[f.name.split("/").length - 1]).loc).toFixed(2)),
                            issues_by100LOC: parseFloat(Number(file.issues.reduce((a, b) => a + b, 0) * 100 / files.find(f => file.name === f.name.split("/")[f.name.split("/").length - 1]).loc).toFixed(2)),
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
        const authors = [{
            'value': 'clear',
            'label': 'All'
        }].concat([...new Set(unnestedData.map(f => f.name.charAt(0).toUpperCase() + f.name.slice(1)))].map(a => ({
            value: a,
            label: a
        })));
        const options = [
            {value: "package", label: "package"},
            {value: "layer", label: "layer"},
            {value: "module", label: "module"}
        ];
        const metrics = ["mods", "authors", "issues_by100LOC", "dependencies"];
        this.setState({
            options,
            authors,
            rules,
            author: authors[0],
            currentKey: options[0],
            metrics,
            currentMetrics: [3, 2],
            data: unnestedData,
            showingMinor: true,
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
                    "authorsDetail": leaves.map(f => f.name),
                    "issues_by100LOC": d3.max(leaves, d => d.issues_by100LOC),
                    "majorIssues_by100LOC": d3.max(leaves, d => d.majorIssues_by100LOC),
                    "mods": d3.sum(leaves, d => d.mods),
                    "authors": d3.max(leaves, d => d.authors),
                    "inDeps": leaves[0].inDeps,
                    "outDeps": leaves[0].outDeps,
                    "dependencies": leaves[0].dependencies,
                    "issuesDetail": leaves[0].issuesDetail,
                    "path": leaves[0].path
                }
            })
            .entries(this.state.data);
        this.max = 0;
        let metric1 = !this.state.showingMinor && this.state.metrics[this.state.currentMetrics[0]] === "issues_by100LOC" ? "majorIssues_by100LOC" : this.state.metrics[this.state.currentMetrics[0]];
        let metric2 = !this.state.showingMinor && this.state.metrics[this.state.currentMetrics[1]] === "issues_by100LOC" ? "majorIssues_by100LOC" : this.state.metrics[this.state.currentMetrics[1]];
        nestedData = nestedData.map(nested => ({
            name: nested.key,
            children: nested.values.map(o => {
                this.max = o.value[metric2] > this.max ? o.value[metric2] : this.max;
                let value = o.value[metric1] + 0.1;
                return {
                    name: o.key,
                    value,
                    authorsDetail: o.value.authorsDetail,
                    mods: o.value.mods,
                    issues_by100LOC: o.value.issues_by100LOC,
                    majorIssues_by100LOC: o.value.majorIssues_by100LOC,
                    authors: o.value.authors,
                    inDeps: o.value.inDeps,
                    outDeps: o.value.outDeps,
                    dependencies: o.value.dependencies,
                    issuesDetail: o.value.issuesDetail,
                    path: o.value.path

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
            .attr("fill", d => !d.depth ? "#6e6e6e" : this.color(d.data[metric2]))
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

        let first = `0 - ${Math.ceil(this.max / 3)} ${metric2}`;
        let second = `${Math.ceil(this.max / 3 + 1)} - ${Math.floor(this.max * 2 / 3)} ${metric2}`;
        let third = ` ${Math.floor(this.max * 2 / 3 + 1)} - ${this.max} ${metric2}`;

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

        if (this.state.author.value !== "clear") {
            legend.selectAll("*").remove();
            const legend2 = svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "end")
                .selectAll("g")
                .data(["Sole author", "Co-author"])
                .join("g")
                .attr("transform", function (d, i) {
                    return "translate(-50," + (-350 + (i * 20)) + ")";
                });
            legend2.append("rect")
                .attr("class", "legend")
                .attr("x", iwidth - 19)
                .attr("width", 19)
                .attr("height", 19)
                .attr("fill", (d, i) => i === 0 ? "red" : "yellow");
            legend2.append("text")
                .attr("x", iwidth - 24)
                .attr("y", 9.5)
                .attr("dy", "0.32em")
                .text(d => d);

            node.filter(d => d.depth === 2 && d.data.authorsDetail.length === 1 && d.data.authorsDetail.find(a => a === this.state.author.value)).attr("fill", "red");
            node.filter(d => d.depth === 2 && d.data.authorsDetail.length !== 1 && d.data.authorsDetail.find(a => a === this.state.author.value)).attr("fill", "yellow");
            node.filter(d => d.depth === 2 && !d.data.authorsDetail.find(a => a === this.state.author.value)).attr("fill", "white");

        }

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
            }).attr("fill", "purple");

            node.filter(function (d1) {
                return d.data.outDeps.find(i => {
                        let name = i.split("/")[i.split("/").length - 1];
                        return d1.data.name === name
                    }
                )
            }).attr("fill", "blue");

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
            }).attr("fill", "white");
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

    handleAuthors(author) {
        this.setState({author}, this.createSVG)
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

    hideMinor() {
        this.setState({showingMinor: !this.state.showingMinor}, this.createSVG);
    }

    render() {
        const {currentKey, options, metrics, currentMetrics, showingMinor, authors, author, showing, rules} = this.state;
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
                {authors && <div className="row mb-3">
                    <hr className="w-100"/>
                    <h5 className="ml-3">Authors</h5>
                    <div className="col-md-3">
                        <Select
                            value={author}
                            onChange={this.handleAuthors}
                            options={authors}
                            defaultValue={authors[0]}
                        />
                    </div>
                    <button type="button" className="btn btn-outline-secondary" onClick={this.resetDeps}>Reset
                        dependencies
                    </button>
                    {currentMetrics && currentMetrics.length === 2 && currentMetrics.includes(2) &&
                    <button type="button" className="btn btn-outline-warning"
                            onClick={this.hideMinor}>{showingMinor ? "Hide minor issues" : "Show minor issues"}
                    </button>}
                </div>}
                <div className="row">
                    <div className="col-md-7 col-sm-12">
                        <svg width={700} height={700}
                             ref={(svg) => {
                                 this.svg = svg;
                             }}>
                        </svg>
                    </div>
                    <div className="col-md-4 col-sm-12 ml-5">
                        {showing ? <div>
                            <h3>Issues in file: {showing.data.name}</h3>
                            <Link className="mt-2 col-md-2" to={{
                                pathname: `/repo/${this.props.projectData.label}/file/${showing.data.name}`,
                                state: {
                                    path: showing.data.path,
                                    issuesDetail: showing.data.issuesDetail,
                                    rules,
                                    repo: this.props.projectData.value.repo
                                }
                            }}>
                                <i className="material-icons">file_copy</i> Go to source
                            </Link>
                        </div> : ""}
                        {showing && showing.data.issuesDetail && showing.data.issuesDetail.map((issue, index) => {
                            return <IssueDetail issue={issue} index={index} fileIndex={1} rules={rules}/>
                        })}
                        {showing && showing.data.issuesDetail.length === 0 && <p>No issues on this file</p>}
                    </div>
                </div>
            </div>
        )
    }
}

export default Structure;