import React, {Component} from 'react';

class Visualization extends Component {

    getIssues(i) {
        let issues = 0;
        for (let layer of this.props.projectData.value.children) {
            for (let file of layer.children) {
                let currentNumber =  file.issues[i] || 0;
                issues = issues += currentNumber;
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
                        <th scope="col">Issue</th>
                        <th scope="col">#</th>
                    </tr>
                    </thead>
                    <tbody>
                    {categorization.rules.map((category, i) => {
                        return (
                            <tr key={i}>
                                <th scope="row">{i + 1}</th>
                                <td>{category.decision}</td>
                                <td>{category.qa}</td>
                                <td>{i + 1}</td>
                                <td>{this.getIssues(i)}</td>
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
