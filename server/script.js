const axios = require('axios');
const fs = require('fs');

let data = {};
let currentData = {};

const addSocial = async () => {
    let projectData = data.find(project => project.name === require('path').basename(process.cwd())).data;
    currentData = projectData[projectData.length - 1];
    let eData = JSON.parse(fs.readFileSync('./inspector.json', 'utf8').trim());
    eData.responsibilities.files.forEach(file => {
        let currentFile = currentData.files.find(f => {
            return (file.file.substring(file.file.indexOf("co/edu/")) === f.name || file.file.substring(file.file.indexOf("com/epm/")) === f.name)
        });
        if (currentFile)
            currentFile.authors = file.authors;
        else {
            let newFile = {
                name: file.file.indexOf("co/edu/") !== -1 ? file.file.substring(file.file.indexOf("co/edu/")) : file.file.substring(file.file.indexOf("com/epm/")),
                issues: [],
                issuesDetail: [],
                authors: file.authors
            };
            currentData.files.push(newFile)
        }
    });
};

const getFiles = () => {
    axios.get("https://archtoringbd.herokuapp.com/files").then(async (response) => {
        data = response.data;
        await addSocial();
        axios.put(`https://archtoringbd.herokuapp.com/files/${require('path').basename(process.cwd())}`, currentData).then((response) => {
            console.log(response);
        })
    })
};

getFiles();