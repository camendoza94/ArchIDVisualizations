import React, {Component} from 'react';
import 'highlight.js/styles/github.css';
import '../styles/App.css';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import CodeView from "./CodeView";
import HomePage from "./HomePage";

require('dotenv').config();

class App extends Component {

    render() {
        return (
            <Router>
                <Switch>
                    <Route exact path='/repo/:repo/file/:file' component={CodeView}/>
                    <Route exact path='/' component={HomePage}/>
                </Switch>
            </Router>
        );
    }
}

export default App;