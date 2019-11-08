import React, {Component} from 'react';
import {Link} from "react-router-dom";
import IssueDetail from "./IssueDetail";

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
        const commits = this.props.currentFiles.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const loc = commits[commits.length - 1].loc;
        let majorIssues = parseFloat(Number(unnestedData.map(f => f.issuesMajor).reduce((a, b) => a + b, 0) * 1000 / loc).toFixed(2));
        let totalIssues = parseFloat(Number(unnestedData.map(f => f.issuesTotal).reduce((a, b) => a + b, 0) * 1000 / loc).toFixed(2));
        let minorIssues = parseFloat(Number(unnestedData.map(f => f.issuesMinor).reduce((a, b) => a + b, 0) * 1000 / loc).toFixed(2));
        this.setState({rules, data: unnestedData, majorIssues, totalIssues, minorIssues, loc});
    }

    render() {
        const {rules, data, majorIssues, minorIssues, totalIssues} = this.state;
        return (
            <>
                <div className="card bg-light mb-3 mt-3" style={{maxWidth: "18rem"}}>
                    <div className="card-header">Summary</div>
                    <div className="card-body">
                        <h5 className="card-title">Quality Profile</h5>
                        <p className="card-text">{totalIssues} Total Issues/1K LOC</p>
                        <p className="card-text text-danger">{majorIssues} Major Issues/1K LOC</p>
                        <p className="card-text text-warning">{minorIssues} Minor Issues/1K LOC</p>
                    </div>
                </div>
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
                                    return <IssueDetail issue={issue} index={index} fileIndex={i} rules={rules}/>
                                })}
                            </div>
                        </div>
                    })}
                </div>
            </>
        )
    }
}

export default Issues;