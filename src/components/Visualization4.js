import React, {Component} from 'react';
import {Link} from "react-router-dom";

class Visualization extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        let unnestedData = [];
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                unnestedData.push({
                    layer: layer.name,
                    issues: file.issues,
                    path: file.path,
                    issuesDetail: file.issuesDetail,
                    mods: file.children ? file.children.map(a => a.rows).reduce((a, b) => a + b, 0) : 0,
                    inDeps: file.inDeps ? file.inDeps.length : 0,
                    outDeps: file.outDeps ? file.outDeps.length : 0,
                    module: file.module,
                    name: file.name
                })

            }
        }
        unnestedData = unnestedData.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
        const categorization = this.props.categorization;
        let rules = categorization.decisions.map(d => d.rules);
        rules = [].concat.apply([], rules).sort((a, b) => a.id - b.id);
        this.setState({rules, data: unnestedData});
    }

    render() {
        const {rules, data} = this.state;
        return (
            <div className="accordion" id="accordion">
                {data && rules && data.filter(file => file.issues.reduce((a, b) => a + b, 0) > 0).map((file, i) => {
                    return <div className="card" key={"file" + i}>
                        <div className="card-header" id={"heading" + i}>
                            <h2 className="mb-0">
                                <button className="btn" type="button" data-toggle="collapse"
                                        data-target={"#collapse" + i}
                                        aria-expanded="true" aria-controls={"#collapse" + i}>
                                    {file.name}<span
                                    className="small">{file.issues.reduce((a, b) => a + b, 0)}</span>
                                </button>
                            </h2>
                            <Link to={{
                                pathname: `/repo/${this.props.projectData.label}/file/${file.name}`,
                                state: {path: file.path}
                            }}>
                                <i className="material-icons">file_copy</i>
                            </Link>
                        </div>

                        <div id={"collapse" + i} className="collapse" aria-labelledby={"heading" + i}
                             data-parent="#accordion">
                            {file.issuesDetail.map((issue, index) => {
                                return <div key={"issue" + issue.rule + "file" + i + "index" + index}
                                            className="card-body">
                                    <div className="card">
                                        <div className="card-body">
                                            <h5 className="card-title">{rules[issue.rule - 1].title}</h5>
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

export default Visualization;