import React, {Component} from 'react';

class Visualization extends Component {

    getIssues(rules) {
        let issues = 0;
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                for (let r of rules) {
                    let currentNumber = file.issues[r] || 0;
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
                        <th scope="col">Issues</th>
                    </tr>
                    </thead>
                    <tbody>
                    {categorization.decisions.map((category, i) => {
                        return (
                            <tr key={i}>
                                <th scope="row">{i + 1}</th>
                                <td>{category.name}</td>
                                <td>{category.qa}</td>
                                <td>{this.getIssues(category.rules)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        )
    }
}

export default Visualization;
