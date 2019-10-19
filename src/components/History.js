import React, {Component, Fragment} from 'react';
import {Doughnut, Line} from 'react-chartjs-2';
import * as d3 from "d3";
import Select from "react-select";

class History extends Component {

    constructor(props) {
        super(props);
        this.state = {showingMinor: true, showingMinorD: true, showingMinorH: true};
        this.hideMinor = this.hideMinor.bind(this);
        this.hideMinorDoughnut = this.hideMinorDoughnut.bind(this);
        this.hideMinorH = this.hideMinorH.bind(this);
        this.handleCategoryHistory = this.handleCategoryHistory.bind(this);
    }

    componentDidMount() {
        let rules = this.props.categorization.decisions.map(d => d.rules);
        rules = [].concat.apply([], rules).sort((a, b) => a.id - b.id);
        let categories = [...new Set(rules.map(r => r.category))].map(r => ({value: r, label: r}));
        this.setState({rules, categories, categoryH: categories[0]}, () => {
            this.renderHistory();
            this.renderIssues();
            this.renderIssuesHistory();
        });
    }

    handleCategoryHistory(categoryH) {
        this.setState({categoryH}, this.renderHistory);
    }

    hideMinorH() {
        this.setState({showingMinorH: !this.state.showingMinorH}, this.renderHistory);
    }

    hideMinor() {
        this.chartReference.chartInstance.config.data.datasets.forEach((d, i) => {
            if (this.state.rules[i].severity === "Minor")
                d._meta["1"].hidden = !d._meta["1"].hidden
        });
        this.chartReference.chartInstance.update();
        this.setState({showingMinor: !this.state.showingMinor});
    }

    hideMinorDoughnut() {
        this.chartReferenceD.chartInstance.config.data.datasets[0]._meta["2"].data.forEach((d, i) => {
            if (this.state.rules[i].severity === "Minor")
                d.hidden = !d.hidden
        });
        this.chartReferenceD.chartInstance.update();
        this.setState({showingMinorD: !this.state.showingMinorD});
    }

    renderHistory() {
        let data = {
            datasets: []
        };
        const options = {
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Issues per 1K LOC'
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    },
                    type: 'time',
                    distribution: 'linear',
                    time: {
                        unit: 'month'
                    }
                }]
            }
        };
        const locs = this.props.currentFiles.data.sort((a, b) => new Date(a.date) - new Date(b.date)).map(c => c.loc);
        const d = this.props.history[0].data.sort((a, b) => new Date(a.date) - new Date(b.date)).map((c, i) => ({
            x: Date.parse(c.date),
            y: c.issues.reduce((a, b, i) => !this.state.showingMinorH && this.state.rules[i].severity === "Minor" ? a : a + b, 0) * 1000 / locs[i]
        })); //TODO history of current project.
        data.datasets.push({
            label: this.props.history[0].name,
            fill: false,
            lineTension: 0,
            backgroundColor: "rgb(204,41,41)",
            borderColor: "rgb(204,41,41)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgb(204,41,41)",
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgb(204,41,41)",
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: d
        });
        this.setState({
            data: data,
            options: options
        });
    }

    renderIssues() {
        const sortedData = this.props.history[0].data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const issues = sortedData[sortedData.length - 1].issues;
        const names = this.state.rules.map(r => r.title);
        const backgroundColors = d3.schemeSet1.concat(d3.schemeSet2);
        let stats = {
            labels: names,
            datasets: [{
                data: issues,
                backgroundColor: backgroundColors
            }]
        };
        this.setState({
            issues: stats
        });
    }

    renderIssuesHistory() {
        let data = {
            datasets: []
        };
        const options = {
            responsive: true,
            tooltips: {
                mode: 'label'
            },
            elements: {
                line: {
                    fill: false
                }
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of violations'
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    },
                    type: 'time',
                    distribution: 'linear',
                    time: {
                        unit: 'month'
                    }
                }]
            }
        };
        let rules = this.props.categorization.decisions.map(d => d.rules);
        rules = [].concat.apply([], rules).sort((a, b) => a.id - b.id).map(r => r.title);
        const backgroundColors = d3.schemeSet1.concat(d3.schemeSet2);
        const d = this.props.history[0].data.sort((a, b) => new Date(a.date) - new Date(b.date));
        rules.forEach((name, i) => {
            let color = backgroundColors[i];
            data.datasets.push({
                label: name,
                fill: false,
                lineTension: 0,
                backgroundColor: color,
                borderColor: color,
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: color,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: 'rgba(220,220,220,1)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: d.map(c => {
                    return {
                        x: c.date,
                        y: c.issues[i]
                    }
                })
            });
        });
        this.setState({
            dataIssues: data,
            optionsIssues: options
        });
    }

    render() {
        const {data, options, issues, dataIssues, optionsIssues, rules, showingMinor, showingMinorD, showingMinorH, categoryH, categories} = this.state;
        return (
            <div className={"row"}>
                {data && options && issues && dataIssues && optionsIssues && rules && categoryH && categories ?
                    <Fragment>
                        <hr className="w-100"/>
                        <h5 className="ml-3">Categories</h5>
                        <div className="col-md-3">
                            <Select
                                value={categoryH}
                                onChange={this.handleCategoryHistory}
                                options={categories}
                                defaultValue={categories[0]}
                            />
                        </div>
                        <button type="button" className="btn btn-outline-warning"
                                onClick={this.hideMinorH}>{showingMinorH ? "Hide minor issues" : "Show minor issues"}
                        </button>
                        <h1 className="text-center col-md-12">Issues history for the project</h1>
                        <Line data={data} options={options}/>
                        <hr className="w-100"/>
                        <button type="button" className="btn btn-outline-warning"
                                onClick={this.hideMinor}>{showingMinor ? "Hide minor issues" : "Show minor issues"}
                        </button>
                        <h1 className="text-center col-md-12">Most common violations throughout the semester</h1>
                        <Line ref={(reference) => this.chartReference = reference} data={dataIssues}
                              options={optionsIssues}/>
                        <hr className="w-100"/>
                        <button type="button" className="btn btn-outline-warning"
                                onClick={this.hideMinorDoughnut}>{showingMinorD ? "Hide minor issues" : "Show minor issues"}
                        </button>
                        <h1 className="text-center col-md-12">Most common violations in latest release</h1>
                        <Doughnut ref={(reference) => this.chartReferenceD = reference} data={issues}/>
                    </Fragment> : ""}
            </div>

        )
    }
}

export default History;
