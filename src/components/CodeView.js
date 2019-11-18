import React, {Component, Fragment} from 'react';
import {getFromAzure, getFromGithub} from "../api";
import SyntaxHighlighter from 'react-syntax-highlighter';
import {darcula} from 'react-syntax-highlighter/dist/esm/styles/hljs';


class CodeView extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        let path = this.props.location.state.path;
        let url = this.props.location.state.repo;
        path = path.substring(2);
        if (url.includes("azure"))
            getFromAzure(url, path).then(contents => this.setState({contents}, this.highlight));
        else
            getFromGithub(url, path).then(data => this.setState({contents: atob(data.content)}, this.highlight))
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        document.querySelectorAll(".warning").forEach((n, i) => {
            let newNode = document.createElement("span");
            newNode.className = "tooltiptext";
            newNode.innerHTML = this.props.location.state.rules.find(r => r.id === this.props.location.state.issuesDetail[i].rule).title;
            for (let j = 0; i + j < this.state.highlight.length; j++) {
                let currentLine = this.state.highlight[j + i];
                if (currentLine === this.state.highlight[j + i + 1]) {
                    newNode.innerHTML += "<br/>" + this.props.location.state.rules.find(r => r.id === this.props.location.state.issuesDetail[i + j + 1].rule).title;
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
            let re = new RegExp(`(private|public) \\S* ${i.description}`, "gi");
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