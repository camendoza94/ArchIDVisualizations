import React, {Component} from 'react';
import '../styles/App.css';
import Visualization from "./Visualization4";
import {getCategorization, getIssueDetail, getProjects} from '../api';
import Select from 'react-select';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import CodeView from "./CodeView";


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        getProjects().then(projects => {
            projects = projects.filter(p => p.name === "DemoProyectoJava");
            let options = projects.map(project => {
                    return {value: project, label: project.name}
                }
            );
            this.setState({projects, options, currentProject: options[0]}, this.getCats)
        })
    }

    getCats() {
        getCategorization().then(projects => {
            this.setState({
                categorization: projects,
                currentCategorization: projects.find(c => c.name === this.state.currentProject.label) || projects[0]
            }, this.getDetail)
        })
    }

    getDetail() {
        getIssueDetail().then(issues => {
            this.setState({
                issues
            })
        })
    }

    handleChange(currentProject) {
        let currentCategorization = this.state.categorization.find(c => c.name === currentProject.label) || this.state.categorization[0];
        this.setState({
            currentProject: currentProject,
            currentCategorization
        })
    }

    render() {
        const {currentProject, options, categorization, currentCategorization, issues} = this.state;
        return (
            <div className="container">
                <Router>
                    <Switch>
                        <Route exact path='/repo/:repo/file/:file' component={CodeView}/>
                    </Switch>
                </Router>
                <h1>ArchID</h1>
                {options && categorization && issues ?
                    <div className="row">
                        <h4 className="col-md-2">Project</h4>
                        <div className="col-md-6">
                            <Select
                                value={currentProject}
                                onChange={this.handleChange}
                                options={options}
                                defaultValue={options[0]}
                            />
                        </div>
                    </div> : ''}
                {currentProject && categorization ?
                    <Visualization categorization={currentCategorization} key={currentProject.label}
                                   issues={issues} projectData={currentProject}/> : ''}
            </div>
        );
    }
}

export default App;
