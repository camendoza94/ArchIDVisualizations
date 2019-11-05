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
        this.handleCategoryIssuesHistory = this.handleCategoryIssuesHistory.bind(this);
        this.handleCategoryIssues = this.handleCategoryIssues.bind(this);
    }

    componentDidMount() {
        let rules = this.props.categorization.decisions.map(d => d.rules);
        rules = [].concat.apply([], rules).sort((a, b) => a.id - b.id);
        let categories = [{
            'value': 'clear',
            'label': 'All'
        }].concat([...new Set(rules.map(r => r.category))].map(r => ({value: r, label: r})));
        this.setState({
            rules,
            categories,
            categoryH: categories[0],
            categoryIH: categories[0],
            categoryI: categories[0]
        }, () => {
            this.renderHistory();
            this.renderIssues();
            this.renderIssuesHistory();
        });
    }

    handleCategoryHistory(categoryH) {
        this.setState({categoryH}, this.renderHistory);
    }

    handleCategoryIssuesHistory(categoryIH) {
        this.chartReference.chartInstance.config.data.datasets.forEach((d, i) => {
            if (categoryIH.value !== "clear" && this.state.rules[i].category !== categoryIH.value)
                this.chartReference.chartInstance.getDatasetMeta(i).hidden = true;
            else if (categoryIH.value === "clear" || (categoryIH.value !== "clear" && this.state.rules[i].category === categoryIH.value))
                this.chartReference.chartInstance.getDatasetMeta(i).hidden = (!this.state.showingMinor && this.state.rules[i].severity === "Minor");
        });
        this.chartReference.chartInstance.update();
        this.setState({categoryIH});
    }

    handleCategoryIssues(categoryI) {
        this.chartReferenceD.chartInstance.getDatasetMeta(0).data.forEach((d, i) => {
            if (categoryI.value !== "clear" && this.state.rules[i].category !== categoryI.value)
                d.hidden = true;
            else if (categoryI.value === "clear" || (categoryI.value !== "clear" && this.state.rules[i].category === categoryI.value))
                d.hidden = (!this.state.showingMinorD && this.state.rules[i].severity === "Minor");
        });
        this.chartReferenceD.chartInstance.update();
        this.setState({categoryI});
    }


    hideMinorH() {
        this.setState({showingMinorH: !this.state.showingMinorH}, this.renderHistory);
    }

    hideMinor() {
        this.setState({showingMinor: !this.state.showingMinor}, () => this.handleCategoryIssuesHistory(this.state.categoryIH));
    }

    hideMinorDoughnut() {
        this.setState({showingMinorD: !this.state.showingMinorD}, () => this.handleCategoryIssues(this.state.categoryI));
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
                        unit: 'week'
                    }
                }]
            }
        };
        const locs = this.props.currentFiles.data.sort((a, b) => new Date(a.date) - new Date(b.date)).map(c => c.loc);
        const d = this.props.currentHistory.data.sort((a, b) => new Date(a.date) - new Date(b.date)).map((c, i) => ({
            x: Date.parse(c.date),
            y: c.issues.reduce((a, b, i) => {
                if ((this.state.categoryH.value !== "clear" && this.state.categoryH.value !== this.state.rules[i].category)
                    || (!this.state.showingMinorH && this.state.rules[i].severity === "Minor"))
                    return a;
                return a + b;
            }, 0) * 1000 / locs[i]
        }));
        data.datasets.push({
            label: this.props.currentHistory.name,
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
        const sortedData = this.props.currentHistory.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const issues = sortedData[sortedData.length - 1].issues;
        const names = this.state.rules.map(r => r.title);
        const backgroundColors = d3.schemeSet1.concat(d3.schemeSet2).concat(d3.schemeSet3);
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
        const backgroundColors = d3.schemeSet1.concat(d3.schemeSet2).concat(d3.schemeSet3);
        const d = this.props.currentHistory.data.sort((a, b) => new Date(a.date) - new Date(b.date));
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
        const {data, options, issues, dataIssues, optionsIssues, rules, showingMinor, showingMinorD, showingMinorH, categoryH, categories, categoryIH, categoryI} = this.state;
        return (
            <div className={"row"}>
                {data && options && issues && dataIssues && optionsIssues && rules && categoryH && categories && categoryIH && categoryI ?
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
                        <h5 className="ml-3">Categories</h5>
                        <div className="col-md-3">
                            <Select
                                value={categoryIH}
                                onChange={this.handleCategoryIssuesHistory}
                                options={categories}
                                defaultValue={categories[0]}
                            />
                        </div>
                        <button type="button" className="btn btn-outline-warning"
                                onClick={this.hideMinor}>{showingMinor ? "Hide minor issues" : "Show minor issues"}
                        </button>
                        <h1 className="text-center col-md-12">Most common violations through time</h1>
                        <Line ref={(reference) => this.chartReference = reference} data={dataIssues}
                              options={optionsIssues}/>
                        <hr className="w-100"/>
                        <h5 className="ml-3">Categories</h5>
                        <div className="col-md-3">
                            <Select
                                value={categoryI}
                                onChange={this.handleCategoryIssues}
                                options={categories}
                                defaultValue={categories[0]}
                            />
                        </div>
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
