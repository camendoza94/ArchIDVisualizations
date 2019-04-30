const glob = require('glob');
const initial = require('./architecture');
const fs = require('fs');
const axios = require('axios');

let architecture = JSON.parse(JSON.stringify(initial));
let mod = {};

const getFiles = (src) => {
    architecture.children.forEach((child) => {
        mod = child;
        child.pattern.forEach((pattern) => {
            let res = glob.sync(src + pattern);
            let newRes = res.map(file => {
                return {
                    name: file.split("/")[file.split("/").length - 1],
                    size: 1,
                    color: "#d62445"
                }
            });
            architecture.children.find(child => child.name === mod.name).children.push(...newRes);
            fs.writeFile("src/architecture2.json", JSON.stringify(architecture), (err) => {
                if (err) {
                    console.log(err);
                }
            });
        })
    });
};

const getIssues = () => {
    axios.get("https://archtoringbd.herokuapp.com/files").then((response) => {
        getFiles('C:/Data/Github/s1_Eventos_201910');
        let files = response.data;

    })
};

getIssues();
