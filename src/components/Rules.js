import React, {Component, Fragment} from 'react';

class Rules extends Component {

    getIssues(rules) {
        let issues = 0;
        if (Array.isArray(rules)) {
            for (let layer of this.props.projectData.value.children) {
                for (let file of layer.children) {
                    for (let r of rules) {
                        let currentNumber = file.issues[r.id - 1] || 0;
                        issues = issues += currentNumber;
                    }
                }
            }
        } else {
            for (let layer of this.props.projectData.value.children) {
                for (let file of layer.children) {
                    let currentNumber = file.issues[rules - 1] || 0;
                    issues = issues += currentNumber;
                }
            }
        }
        return issues;
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
                        <th scope="col"/>
                    </tr>
                    </thead>
                    <tbody>
                    {categorization.decisions.map((category, i) => {
                        return (
                            <Fragment key={"Fragment" + i}>
                                <tr key={i} data-toggle="collapse" data-target={"#collapse" + i}>
                                    <th scope="row">{i + 1}</th>
                                    <td>{category.title}</td>
                                    <td>{category.qa}</td>
                                    <td>{this.getIssues(category.rules)}</td>
                                    <td/>
                                    <td>
                                        <button className="btn btn-link">View Detail</button>
                                    </td>
                                </tr>
                                <tr className="collapse detail" id={"collapse" + i}>
                                    <th scope="col">#</th>
                                    <th scope="col">Design Decision</th>
                                    <th scope="col">Rule Name</th>
                                    <th scope="col">Issues</th>
                                    <th scope="col">Severity</th>
                                    <th scope="col">Category</th>
                                </tr>
                                {category.rules.map((rule, j) => {
                                    return (

                                        <tr key={"d" + i + j} className="collapse detail" id={"collapse" + i}>
                                            <th scope="row">{(i + 1) + "." + (j + 1)}</th>
                                            <td>{category.title}</td>
                                            <td><button className="btn btn-link text-left" onClick={() => this.props.goToIssues(rule.title)}>{rule.title}</button></td>
                                            <td>{this.getIssues(rule.id)}</td>
                                            <td className={rule.severity === "Minor" ? "text-warning" : "text-danger"}>{rule.severity}</td>
                                            <td>{rule.category}</td>
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

export default Rules;
