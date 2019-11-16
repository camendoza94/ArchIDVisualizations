import React, {Component} from 'react';
import * as d3 from "d3";
import Select from "react-select";
import Slider, {createSliderWithTooltip} from 'rc-slider';
import '../styles/rc-slider.css';
import {withRouter} from 'react-router-dom'

const SliderWithTooltip = createSliderWithTooltip(Slider);

class Metrics extends Component {

    constructor(props) {
        super(props);
        this.state = {coefficients: [100, 70, 40, 40]};
        this.handleChange = this.handleChange.bind(this);
        this.handleSlider = this.handleSlider.bind(this);
        this.hideMinor = this.hideMinor.bind(this);
        this.handleCategory = this.handleCategory.bind(this);
    }

    componentDidMount() {
        this.max = 0;
        let unnestedData = [];
        const categorization = this.props.categorization;
        let rules = categorization.decisions.map(d => d.rules);
        rules = [].concat.apply([], rules).sort((a, b) => a.id - b.id);
        let categories = [{
            'value': 'clear',
            'label': 'All'
        }].concat([...new Set(rules.map(r => r.category))].map(r => ({value: r, label: r})));
        const commits = this.props.currentFiles.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const files = commits[commits.length - 1].files;
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                let f = files.find(f => file.name === f.name.split("/")[f.name.split("/").length - 1]);
                let loc = (f && f.loc) || 1;
                this.max = file.size > this.max ? file.size : this.max;
                unnestedData.push({
                    layer: layer.name,
                    path: file.path,
                    issuesDetail: file.issuesDetail.map(d => this.props.issues.find(i => i.id === d.id)),
                    issues_by100LOC: parseFloat(Number(file.issues.reduce((a, b) => a + b, 0) * 100 / loc).toFixed(2)),
                    majorIssues_by100LOC: parseFloat(Number(file.issues.reduce((a, b, i) => rules[i].severity !== "Minor" ? a + b : a, 0) * 100 / loc).toFixed(2)),
                    bugs_by100LOC: parseFloat(Number(file.issues.reduce((a, b, i) => rules[i].category === "Bug" ? a + b : a, 0) * 100 / loc).toFixed(2)),
                    ATDItems_by100LOC: parseFloat(Number(file.issues.reduce((a, b, i) => (rules[i].category === "Architectural" || rules[i].category === "ATD Item") ? a + b : a, 0) * 100 / loc).toFixed(2)),
                    majorBugs_by100LOC: parseFloat(Number(file.issues.reduce((a, b, i) => rules[i].category === "Bug" && rules[i].severity !== "Minor" ? a + b : a, 0) * 100 / loc).toFixed(2)),
                    majorATDItems_by100LOC: parseFloat(Number(file.issues.reduce((a, b, i) => (rules[i].category === "Architectural" || rules[i].category === "ATD Item") && rules[i].severity !== "Minor" ? a + b : a, 0) * 100 / loc).toFixed(2)),
                    mods: file.children ? file.children.map(a => a.rows).reduce((a, b) => a + b, 0) : 0,
                    inDeps: file.inDeps ? file.inDeps.length : 0,
                    outDeps: file.outDeps ? file.outDeps.length : 0,
                    loc,
                    name: file.name
                })

            }
        }
        const options = [{value: "name", label: "name"}, {value: "layer", label: "layer"}];
        this.setState({
            options,
            currentKey: options[0],
            data: unnestedData,
            rules,
            showingMinor: true,
            categories,
            category: categories[0]
        }, this.createSVG);
    }

    handleCategory(category) {
        this.setState({category}, this.createSVG);
    }

    createSVG() {
        const height = 650;
        const width = 1000;
        let columns = d3.keys(this.state.data[0]).filter(d => {
            if (d === "majorIssues_by100LOC")
                return this.state.category.value === "clear" && !this.state.showingMinor;
            if (d === "bugs_by100LOC")
                return this.state.category.value === "Bug" && this.state.showingMinor;
            if (d === "ATDItems_by100LOC")
                return (this.state.category.value === "Architectural" || this.state.category.value === "ATD Item") && this.state.showingMinor;
            if (d === "majorBugs_by100LOC")
                return this.state.category.value === "Bug" && !this.state.showingMinor;
            if (d === "majorATDItems_by100LOC")
                return (this.state.category.value === "Architectural" || this.state.category.value === "ATD Item") && !this.state.showingMinor;
            if (d === "issues_by100LOC")
                return this.state.category.value === "clear" && this.state.showingMinor;
            return d !== this.state.currentKey.label && typeof (this.state.data[0][d]) === "number"
        }).slice(0, 4);

        let adjustedData = [];
        this.state.data.forEach((d) => {
            const ret = {};
            ret[this.state.currentKey.label] = d[this.state.currentKey.label];
            ret._total = 0;
            ret.loc = d.loc;
            columns.forEach((col) => {
                ret[col] = (d[col] || 0);
                ret._total += ret[col];
            });
            let existing = adjustedData.find(c => c[this.state.currentKey.label] === ret[this.state.currentKey.label]);
            if (existing) {
                columns.forEach(col => {
                    if (col.endsWith("_by100LOC")) {
                        let newIssues = ret[col] * ret.loc / 100;
                        let oldIssues = existing[col] * existing.loc / 100;
                        existing[col] = (newIssues + oldIssues) / (existing.loc + ret.loc)
                    } else
                        existing[col] += ret[col];
                    existing._total += ret[col];
                });
                existing.loc += ret.loc;
            } else {
                adjustedData.push(ret);
            }
        });
        let scales = columns.map((col, i) =>
            d3.scaleLinear()
                .domain([0, d3.max(adjustedData, e => e[col])])
                .range([0, this.state.coefficients[i]]));

        let adjustedDataFinal = [];

        adjustedData.forEach((d) => {
            const ret = {};
            ret[this.state.currentKey.label] = d[this.state.currentKey.label];
            ret._total = 0;
            columns.forEach((col, i) => {
                ret[col] = scales[i](d[col] || 0);
                ret._total += ret[col];
            }); // adjust the values by the coefficient
            let existing = adjustedDataFinal.find(c => c[this.state.currentKey.label] === ret[this.state.currentKey.label]);
            if (existing) {
                columns.forEach(col => {
                    existing[col] += ret[col];
                    existing._total += ret[col];
                });
            } else {
                adjustedDataFinal.push(ret);
            }
        });
        adjustedDataFinal = adjustedDataFinal.sort((a, b) => d3.descending(a._total, b._total)).slice(0, 20); //TODO Max number of rows
        let stackedData = d3.stack()
            .keys(columns)
            (adjustedDataFinal);
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
        y.domain(adjustedDataFinal.map(d => d[this.state.currentKey.label]));
        z.domain([0, columns.length]);

        g.append("g")
            .selectAll("g")
            .data(stackedData)
            .join("g")
            .attr("fill", d => z(d.key))
            .attr("stroke", "white")
            .attr("data-index", (d, i) => i)
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => x(d[0]))
            .attr("width", d => x(d[1]) - x(d[0]))
            .attr("y", d => y(d.data[this.state.currentKey.label]))
            .attr("height", y.bandwidth())
            .append("title").text((d, i, j) => {
            const key = j[i].parentNode.parentNode.getAttribute("data-index");
            return columns[key] + ": " + adjustedData.find(c => c[this.state.currentKey.label] === adjustedDataFinal[i][this.state.currentKey.label])[columns[key]];
        });

        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(null, "s"))
            .call(axis => axis.selectAll("text").style("font-size", `${iheight / 70}pt`))
            .append("text")
            .attr("x", 2)
            .attr("y", iheight)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .text("Combined index");

        d3.selectAll(".tick")
            .attr("cursor", "pointer")
            .on("click", d => {
                const file = this.state.data.find(f => f.name === d);
                this.props.history.push({
                    pathname: `/repo/${this.props.projectData.label}/file/${d}`,
                    state: {
                        path: file.path,
                        issuesDetail: file.issuesDetail,
                        rules: this.state.rules,
                        repo: this.props.projectData.value.repo
                    }
                });
            });

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

    handleSlider(newCoefficient, id) {
        let newCoefficients = this.state.coefficients;
        newCoefficients[id] = newCoefficient;
        this.setState({coefficients: newCoefficients}, this.createSVG)
    }

    hideMinor() {
        this.setState({showingMinor: !this.state.showingMinor}, this.createSVG);
    }

    render() {
        const {currentKey, options, coefficients, showingMinor, categories, category} = this.state;
        const style = {width: 500, margin: 10};
        return (
            <div>
                {options ?
                    <div>
                        <div className="row">
                            <h4 className="col-md-3">Key</h4>
                            <div className="col-md-6">
                                <Select
                                    value={currentKey}
                                    onChange={this.handleChange}
                                    options={options}
                                    defaultValue={options[0]}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <h4 className="col-md-3">Metrics' Weights</h4>
                        </div>
                        <div className="row">
                            <p className="col-md-3">Issues/100LOC:</p>
                            <div className="col-md-6">
                                <SliderWithTooltip
                                    style={style}
                                    max={100}
                                    defaultValue={100}
                                    onChange={(e) => this.handleSlider(e, 0)}
                                />
                            </div>
                            <p className="col-md-2">{coefficients[0]}</p>
                        </div>
                        <div className="row">
                            <p className="col-md-3">Modifications:</p>
                            <div className="col-md-6">
                                <SliderWithTooltip
                                    style={style}
                                    max={100}
                                    defaultValue={70}
                                    onChange={(e) => this.handleSlider(e, 1)}
                                />
                            </div>
                            <p className="col-md-2">{coefficients[1]}</p>
                        </div>
                        <div className="row">
                            <p className="col-md-3">Dependencies In:</p>
                            <div className="col-md-6">
                                <SliderWithTooltip
                                    style={style}
                                    max={100}
                                    defaultValue={40}
                                    onChange={(e) => this.handleSlider(e, 2)}
                                />
                            </div>
                            <p className="col-md-2">{coefficients[2]}</p>
                        </div>
                        <div className="row">
                            <p className="col-md-3">Dependencies Out:</p>
                            <div className="col-md-6">
                                <SliderWithTooltip
                                    style={style}
                                    max={100}
                                    defaultValue={40}
                                    onChange={(e) => this.handleSlider(e, 3)}
                                />
                            </div>
                            <p className="col-md-2">{coefficients[3]}</p>
                        </div>
                        <div className="row">
                            <hr className="w-100"/>
                            <h5 className="ml-3">Categories</h5>
                            <div className="col-md-3">
                                <Select
                                    value={category}
                                    onChange={this.handleCategory}
                                    options={categories}
                                    defaultValue={categories[0]}
                                />
                            </div>
                            <button type="button" className="btn btn-outline-warning"
                                    onClick={this.hideMinor}>{showingMinor ? "Hide minor issues" : "Show minor issues"}
                            </button>
                        </div>
                    </div> : ''}
                <svg
                    ref={(svg) => {
                        this.svg = svg;
                    }}>
                </svg>
            </div>
        )
    }
}

export default withRouter(Metrics);