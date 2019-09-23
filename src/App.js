import React, {Component} from 'react';
import './App.css';
import Visualization from "./Visualization";
import {getProjects} from './api';
import Select from 'react-select';


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {vizType: 0};
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        getProjects().then(projects => {
            let options = projects.map(project => {
                    return {value: project, label: project.name}
                }
            );
            this.setState({projects, options, currentProject: options[0]})
        })
    }

    handleChange(currentProject) {
        this.setState({currentProject: currentProject})
    }

    render() {
        const {currentProject, options, vizType} = this.state;
        return (
            <div className="container">
                <h1>ArchID</h1>
                {options ?
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
                {currentProject ?
                    <Visualization key={currentProject.label} vizType={vizType} projectData={currentProject}/> : ''}
            </div>
        );
    }
}

export default App;
