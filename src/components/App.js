import React, {Component} from 'react';
import '../styles/App.css';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import CodeView from "./CodeView";
import HomePage from "./HomePage";
import Metrics from "./Metrics";
import Structure from "./Structure";
import Rules from "./Rules";
import Issues from "./Issues";

require('dotenv').config();

class App extends Component {

    render() {
        return (
            <Router>
                <Switch>
                    <Route exact path='/repo/:repoName/file/:file' component={CodeView}/>
                    <Route exact path='/' component={HomePage}/>
                    <Route exact path='/metrics' component={Metrics}/>
                    <Route exact path='/structure' component={Structure}/>
                    <Route exact path='/rules' component={Rules}/>
                    <Route exact path='/issues' component={Issues}/>
                </Switch>
            </Router>
        );
    }
}

export default App;
