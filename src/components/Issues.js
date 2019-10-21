import React, {Component} from 'react';
import {Link} from "react-router-dom";

class Issues extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const categorization = this.props.categorization;
        let rules = categorization.decisions.map(d => d.rules);
        rules = [].concat.apply([], rules).sort((a, b) => a.id - b.id);
        let unnestedData = [];
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                unnestedData.push({
                    layer: layer.name,
                    issues: file.issues,
                    issuesTotal: file.issues.reduce((a, b) => a + b, 0),
                    issuesMinor: file.issues.reduce((a, b, i) => rules[i].severity === "Minor" ? a + b : a, 0),
                    issuesMajor: file.issues.reduce((a, b, i) => rules[i].severity === "Major" ? a + b : a, 0),
                    path: file.path,
                    issuesDetail: file.issuesDetail.map(d => this.props.issues.find(i => i.id === d.id)),
                    mods: file.children ? file.children.map(a => a.rows).reduce((a, b) => a + b, 0) : 0,
                    inDeps: file.inDeps ? file.inDeps.length : 0,
                    outDeps: file.outDeps ? file.outDeps.length : 0,
                    module: file.module,
                    name: file.name
                })

            }
        }
        unnestedData = unnestedData.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        this.setState({rules, data: unnestedData});
    }

    render() {
        const {rules, data} = this.state;
        return (
            <div className="accordion" id="accordion">
                {data && rules && data.filter(file => file.issuesTotal > 0).map((file, i) => {
                    return <div className="card" key={"file" + i}>
                        <div className="card-header" id={"heading" + i} data-toggle="collapse"
                             data-target={"#collapse" + i}
                             aria-expanded="true" aria-controls={"#collapse" + i}>
                            <div className="row">
                                <h2 className="mb-0 col-md-8">
                                    <button className="btn font-weight-bold" type="button">
                                        {file.name}
                                    </button>
                                </h2>
                                {file.issuesMinor ? <span className="small mt-2 col-md-1 text-warning">
                                    {file.issuesMinor} minor issue(s)
                                </span> : <span className="small mt-2 col-md-1 text-warning"/>}
                                {file.issuesMajor ? <span className="small mt-2 col-md-1 text-danger">
                                    {file.issuesMajor} major issue(s)
                                </span> : <span className="small mt-2 col-md-1 text-danger"/>}
                                <Link className="mt-2 col-md-2" to={{
                                    pathname: `/repo/${this.props.projectData.label}/file/${file.name}`,
                                    state: {
                                        path: file.path,
                                        issuesDetail: file.issuesDetail,
                                        rules,
                                        repo: this.props.projectData.value.repo
                                    }
                                }}>
                                    <i className="material-icons">file_copy</i> Go to source
                                </Link>
                            </div>
                        </div>

                        <div id={"collapse" + i} className="collapse" aria-labelledby={"heading" + i}
                             data-parent="#accordion">
                            {file.issuesDetail.map((issue, index) => {
                                return <div key={"issue" + issue.rule + "file" + i + "index" + index}
                                            className="card-body">
                                    <div className="card">
                                        <div className="card-body">
                                            <h5 className={rules[issue.rule - 1].severity === "Minor" ? "card-title text-warning" : "card-title text-danger"}>{rules[issue.rule - 1].title}<span
                                                className="small ml-2 text-body">{issue.description === "Class" ? issue.description : issue.description + "()"}</span>
                                            </h5>
                                            <h6 className="card-subtitle mb-2 text-muted">
                                                <i className="material-icons">bug_report</i>
                                                {rules[issue.rule - 1].category}
                                                <i className="material-icons">warning</i>
                                                {rules[issue.rule - 1].severity}
                                            </h6>
                                        </div>
                                    </div>
                                </div>
                            })}
                        </div>
                    </div>
                })}
            </div>
        )
    }
}

export default Issues;