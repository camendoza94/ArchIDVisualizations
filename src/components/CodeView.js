import React, {Component, Fragment} from 'react';
import {getFromAzure} from "../api";

class CodeView extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const repo = this.props.match.params.repo;
        let path = this.props.location.state.path;
        path = path.substring(2);
        getFromAzure(repo, path).then(contents => this.setState({contents}));
    }


    render() {
        const {contents} = this.state;
        return (
            <Fragment>
                {contents ? <pre><code className="java">{contents}</code></pre> : ""}
            </Fragment>
        )
    }
}

export default CodeView;