import React, {Component, Fragment} from 'react';
import {getFromAzure} from "../api";
import SyntaxHighlighter from 'react-syntax-highlighter';
import {github} from 'react-syntax-highlighter/dist/esm/styles/hljs';


class CodeView extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const repo = this.props.match.params.repo;
        let path = this.props.location.state.path;
        path = path.substring(2);
        getFromAzure(repo, path).then(contents => this.setState({contents}, this.highlight));
    }

    highlight() {
        const start = this.state.contents.indexOf("public");
        const line = this.state.contents.substring(0, start).split("\n").length;
        this.setState({highlight: [line]})
    }


    render() {
        const {contents, highlight} = this.state;
        return (
            <Fragment>
                {contents && highlight ?
                    <SyntaxHighlighter
                        language="java"
                        style={github}
                        wrapLines={true}
                        showLineNumbers={true}
                        lineProps={lineNumber => {
                            let style = {display: 'block'};
                            if (highlight.includes(lineNumber)) {
                                style.backgroundColor = '#ffecec';
                            }
                            const onClick = function onClick() {
                                alert(`Line Number Clicked: ${lineNumber}`);
                            };
                            return {style, onClick};
                        }}>
                        {contents}
                    </SyntaxHighlighter> : ""}
            </Fragment>
        )
    }
}

export default CodeView;