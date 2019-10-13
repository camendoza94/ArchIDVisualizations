const glob = require('glob');
const initial = require('./archIntergrupo.json');
const axios = require('axios');

let architecture = JSON.parse(JSON.stringify(initial));
let mod = {};
let data = {};

function getPath(s) {
    let parts = s.split("/");
    let path = "";
    let i = parts.findIndex(p => p === "co" || p === "com");
    for (i; i < parts.length; i++) {
        if (i === parts.length - 1)
            path += parts[i];
        else
            path += parts[i] + "/";
    }
    return path;

}

const getFiles = async (src) => {
    let projectData = data.find(project => project.name === require('path').basename(process.cwd())).data;
    let currentData = projectData[projectData.length - 1];
    architecture.name = require('path').basename(process.cwd());
    architecture.repo = currentData.repo;
    architecture.children.forEach((child) => {
        mod = child;
        child.pattern.forEach((pattern) => {
            let res = glob.sync(src + pattern);
            let newRes = res.map(file => {
                let found = currentData.files.find(f => f.name === getPath(file));
                let issues = found && found.issues ? found.issues : [];
                let issuesDetail = found && found.issuesDetail ? found.issuesDetail : [];
                let authors = found && found.authors ? found.authors : [];
                let outDeps = found && found.dependenciesOut ? found.dependenciesOut : [];
                let inDeps = found && found.dependenciesIn ? found.dependenciesIn : [];
                let name = file.split("/")[file.split("/").length - 1];
                let moduleEnd = 0;
                for (let i = 1; i < name.length; i++) {
                    if (name.charAt(i) === name.charAt(i).toUpperCase()) {
                        moduleEnd = i;
                        break;
                    }
                }
                let module = name.substring(0, moduleEnd);
                return {
                    path: file,
                    name,
                    issues,
                    issuesDetail,
                    children: authors,
                    outDeps,
                    inDeps,
                    module
                }
            });
            architecture.children.find(child => child.name === mod.name).children.push(...newRes);
        });
    });
};

const getIssues = () => {
    axios.get("https://archtoringbd.herokuapp.com/files").then(async (response) => {
        data = response.data;
        await getFiles('./');
        axios.put(`https://archtoringbd.herokuapp.com/architecture/${require('path').basename(process.cwd())}`, architecture).then((response) => {
            console.log(response);
        })
    })
};

getIssues();
