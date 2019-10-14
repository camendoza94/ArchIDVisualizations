import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';

class History extends Component {

    constructor(props) {
        super(props);
        this.state = {}
    }

    componentDidMount() {
        this.renderHistory();
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
                        labelString: 'Number of architectural issues'
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
        const d = this.props.history[0].data.sort((a, b) => new Date(b.date) - new Date(a.date)).map(c => ({
            x: Date.parse(c.date),
            y: c.issues.reduce((a, b) => a + b, 0)
        }));
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

    render() {
        const {data, options} = this.state;
        return (
            <div className={"row"}>
                {data && options ? <Line data={this.state.data} options={this.state.options}/> : ""}
            </div>

        )
    }
}

export default History;
