import React, {Component, Fragment} from 'react';
import {getFromAzure} from "../api";
import hljs from 'highlight.js/lib/highlight';
import java from 'highlight.js/lib/languages/java';

hljs.registerLanguage('java', java);

class CodeView extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const repo = this.props.match.params.repo;
        let path = this.props.location.state.path;
        path = path.substring(2);
        this.updateCodeSyntaxHighlighting();
        getFromAzure(repo, path).then(contents => this.setState({contents}));
    }

    componentDidUpdate() {
        this.updateCodeSyntaxHighlighting();
    }

    updateCodeSyntaxHighlighting = () => {
        document.querySelectorAll("pre code").forEach(block => {
            hljs.highlightBlock(block);
        });
    };


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