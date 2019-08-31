import React, {Component} from 'react';
import './App.css';
import Visualization from "./Visualization";
import {getProjects} from './api';
import Select from 'react-select';


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {};
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
        const {currentProject, options} = this.state;
        return (
            <div>
                {options ?
                <Select
                    value={currentProject}
                    onChange={this.handleChange}
                    options={options}
                    defaultValue={options[0]}
                /> : ''}
                {currentProject ? <Visualization key={currentProject.label} projectData={currentProject} width="932" height="932"/> : ''}
            </div>
        );
    }
}

export default App;
