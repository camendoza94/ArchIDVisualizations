import React, {Component} from 'react';
import {getFromAzure} from "../api";

class Visualization extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const repo = this.props.match.params.repo;
        const path = this.props.match.params.file;
        getFromAzure(repo, path).then(contents => this.setState({contents}));
    }


    render() {
        const {contents} = this.state;
        return (
            {contents} && <pre>
                contents
            </pre>
        )
    }
}

export default Visualization;