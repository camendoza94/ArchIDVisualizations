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

    componentDidUpdate(prevProps, prevState, snapshot) {
        document.querySelectorAll(".warning").forEach((n, i) => {
            let newNode = document.createElement("span");
            newNode.className = "tooltiptext";
            newNode.innerText = this.props.location.state.rules.find(r => r.id === this.props.location.state.issuesDetail[i].rule).title;
            for (let j = i; j < this.state.highlight.length; j++) {
                let currentLine = this.state.highlight[j];
                if (currentLine === this.state.highlight[j + 1]) {
                    newNode.innerText += "\r\n" + this.props.location.state.rules.find(r => r.id === this.props.location.state.issuesDetail[i + 1].rule).title;
                } else
                    break;

            }
            n.appendChild(newNode)
        });
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
                                className = "warning";
                            }
                            return {style, className};
                        }}>
                        {contents}
                    </SyntaxHighlighter> : ""}
            </Fragment>
        )
    }
}

export default CodeView;