const glob = require('glob');
const initial = require('./architecture');
const axios = require('axios');

let architecture = JSON.parse(JSON.stringify(initial));
let modules = {name: "icfes", children:[]};
let data = {};

function getModuleAndFeature(s) {
    let parts = s.split("/");
    let path = "";
    let module = "";
    let feature = "";
    for (let i = 2; i >= 0; i--) {
        if (i === 0)
            path += parts[parts.length - 1 - i];
        else {
            path += parts[parts.length - 1 - i] + "/";
            if (i === 2)
                module = parts[parts.length - 1 - i];
            if (i === 1)
                feature = parts[parts.length - 1 - i];
        }
    }
    let existingModule = modules.children.find(m => m.name === module);
    if (existingModule) {
        let existingFeature = existingModule.children.find(f => f.name === feature);
        if (existingFeature)
            existingFeature.size++;
        else {
            let newFeature = {
                name: feature ,
                size: 1
            };
            existingModule.children.push(newFeature);
        }
    } else {
        let newModule = {
            name: module,
            children: [{
                name: feature,
                size: 1
            }]
        };
        modules.children.push(newModule);
    }

}

const getFiles = async (src) => {
    architecture.name = require('path').basename(process.cwd());
    architecture.children.forEach((child) => {
        child.pattern.forEach((pattern) => {
            let res = glob.sync(src + pattern);
            res.forEach(file => {
                getModuleAndFeature(file);
            })
        });
    });
};

//TODO Add dependencies from "files" endpoint

const getIssues = () => {
    axios.get("https://archtoringbd.herokuapp.com/files").then(async (response) => {
        data = response.data;
        await getFiles('./');
        axios.put(`https://archtoringbd.herokuapp.com/architecture/${require('path').basename(process.cwd())}Dependencies`, modules).then((response) => {
            console.log(response);
        })
    })
};

getIssues();