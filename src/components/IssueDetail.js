import React, {Component} from 'react';

class IssueDetail extends Component {
    render() {
        return (
            <div key={"issue" + this.props.issue.rule + "file" + this.props.fileIndex + "index" + this.props.index}
                 className="card-body">
                <div className="card">
                    <div className="card-body">
                        <h5 className={this.props.rules[this.props.issue.rule - 1].severity === "Minor" ? "card-title text-warning" : "card-title text-danger"}>{this.props.rules[this.props.issue.rule - 1].title}<span
                            className="small ml-2 text-body">{this.props.issue.description === "Class" ? this.props.issue.description : this.props.issue.description + "()"}</span>
                        </h5>
                        <h6 className="card-subtitle mb-2 text-muted">
                            <i className="material-icons">bug_report</i>
                            {this.props.rules[this.props.issue.rule - 1].category}
                            <i className="material-icons">warning</i>
                            {this.props.rules[this.props.issue.rule - 1].severity}
                        </h6>
                    </div>
                </div>
            </div>
        )
    }
}


export default IssueDetail;