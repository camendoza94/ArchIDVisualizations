import React, {Component, Fragment} from 'react';

class Visualization extends Component {

    getIssues(rules) {
        let issues = 0;
        if (Array.isArray(rules)) {
            for (let layer of this.props.projectData.value.children) {
                for (let file of layer.children) {
                    for (let r of rules) {
                        let currentNumber = file.issues[r] || 0;
                        issues = issues += currentNumber;
                    }
                }
            }
        } else {
            for (let layer of this.props.projectData.value.children) {
                for (let file of layer.children) {
                    let currentNumber = file.issues[rules] || 0;
                    issues = issues += currentNumber;
                }
            }
        }
        return issues;
    }

    getRuleInfo(rule) {

    }

    render() {
        const {categorization} = this.props;
        return (
            <div className={"row"}>
                <table className={"table"}>
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Design Decision</th>
                        <th scope="col">Quality Attribute</th>
                        <th scope="col">Issues Total</th>
                        <th scope="col"/>
                    </tr>
                    </thead>
                    <tbody>
                    {categorization.decisions.map((category, i) => {
                        return (
                            <Fragment key={"Fragment" + i}>
                                <tr key={i} data-toggle="collapse" data-target={"#collapse" + i}>
                                    <th scope="row">{i + 1}</th>
                                    <td>{category.name}</td>
                                    <td>{category.qa}</td>
                                    <td>{this.getIssues(category.rules)}</td>
                                    <td><a className="action">View Detail</a></td>
                                </tr>
                                <tr className="collapse detail" id={"collapse" + i}>
                                    <th scope="col">#</th>
                                    <th scope="col">Design Decision</th>
                                    <th scope="col">Rule Name</th>
                                    <th scope="col">Issues</th>
                                    <th scope="col">Severity</th>
                                </tr>
                                {category.rules.map((rule, j) => {
                                    return (

                                        <tr key={"d" + i + j} className="collapse detail" id={"collapse" + i}>
                                            <th scope="row">{(i + 1) + "." + (j + 1)}</th>
                                            <td>{category.name}</td>
                                            <td>{category.qa}</td>
                                            <td>{this.getIssues(rule)}</td>
                                            <td>{this.getRuleInfo(rule)}</td>
                                        </tr>)
                                })}
                            </Fragment>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        )
    }
}

export default Visualization;
