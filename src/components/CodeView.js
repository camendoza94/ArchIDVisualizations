import React, {Component, Fragment} from 'react';
import {getFromAzure} from "../api";
import SyntaxHighlighter from 'react-syntax-highlighter';
import {darcula} from 'react-syntax-highlighter/dist/esm/styles/hljs';


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
        let lines = [];
        let start = 0;
        let line = 0;
        this.props.location.state.issuesDetail.forEach(i => {
            let re = new RegExp(`(private|public) \\S* ${i.description}`, "g");
            if (i.description === "Class")
                start = this.state.contents.indexOf("public");
            else
                start = this.state.contents.search(re);
            line = this.state.contents.substring(0, start).split("\n").length;
            lines.push(line)
        });
        this.setState({highlight: lines})
    }


    render() {
        const {contents, highlight} = this.state;
        return (
            <Fragment>
                {contents && highlight ?
                    <SyntaxHighlighter
                        language="java"
                        style={darcula}
                        wrapLines={true}
                        showLineNumbers={true}
                        lineProps={lineNumber => {
                            let style = {display: "block"};
                            let className = "";
                            if (highlight.includes(lineNumber)) {
                                style.backgroundColor = '#330901';
                                className = "warning"
                            }
                            const onClick = function onClick() {
                                alert(`Line Number Clicked: ${lineNumber}`);
                            };

                            return {style, onClick, className};
                        }}>
                        {contents}
                    </SyntaxHighlighter> : ""}
                <button type="button" className="btn btn-secondary" data-toggle="tooltip" data-placement="top"
                        title="Tooltip on top">
                    Tooltip on top
                </button>
                <button type="button" className="btn btn-secondary" data-toggle="tooltip" data-placement="right"
                        title="Tooltip on right">
                    Tooltip on right
                </button>
                <button type="button" className="btn btn-secondary" data-toggle="tooltip" data-placement="bottom"
                        title="Tooltip on bottom">
                    Tooltip on bottom
                </button>
                <button type="button" className="btn btn-secondary" data-toggle="tooltip" data-placement="left"
                        title="Tooltip on left">
                    Tooltip on left
                </button>
            </Fragment>
        )
    }
}

export default CodeView;