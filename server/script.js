const axios = require('axios');
const fs = require('fs');
const {execSync} = require('child_process');

let data = {};
let currentData = {};

const addSocialAndLocs = async () => {
    let projectData = data.find(project => project.name === require('path').basename(process.cwd())).data.sort((a, b) => new Date(a.date) - new Date(b.date));
    currentData = projectData[projectData.length - 1];
    const commitId = currentData.commitId;
    const loc = execSync(`cloc ${commitId} --by-file-by-lang`).toString();
    const eData = JSON.parse(fs.readFileSync('./inspector.json', 'utf8').trim());
    const projectLocJava = loc.substring(loc.indexOf("Java "));
    const projectLocLine = projectLocJava.substring(0, projectLocJava.indexOf("\n"));
    currentData.loc = parseInt(projectLocLine.substring(projectLocLine.lastIndexOf(" ") + 1));
    eData.responsibilities.files.forEach(file => {
        let currentFile = currentData.files.find(f => {
            return (file.file.substring(file.file.indexOf("co/edu/")) === f.name || file.file.substring(file.file.indexOf("com/epm/")) === f.name)
        });
        let currentLoc = "0";
        if (loc.indexOf(file.file) !== -1) {
            let line = loc.substring(loc.indexOf(file.file));
            let currentLine = line.substring(0, line.indexOf("\n"));
            currentLoc = currentLine.substring(currentLine.lastIndexOf(" ") + 1);
        }
        if (currentFile) {
            currentFile.authors = file.authors;
            currentFile.loc = parseInt(currentLoc);
        } else {
            let newFile = {
                name: file.file.indexOf("co/edu/") !== -1 ? file.file.substring(file.file.indexOf("co/edu/")) : file.file.substring(file.file.indexOf("com/epm/")),
                issues: [],
                issuesDetail: [],
                authors: file.authors,
                loc: parseInt(currentLoc)
            };
            currentData.files.push(newFile)
        }
    });
};

const getFiles = () => {
    axios.get("https://archtoringbd.herokuapp.com/files").then(async (response) => {
        data = response.data;
        await addSocialAndLocs();
        axios.put(`https://archtoringbd.herokuapp.com/files/${require('path').basename(process.cwd())}`, currentData).then((response) => {
            console.log(response);
        })
    })
};

getFiles();