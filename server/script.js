const axios = require('axios');
const eData = require('./evolutionaryData');


let data = {};

const addSocial = () => {
    let currentData = data.find(project => project.name === require('path').basename(process.cwd())).data[0];
    currentData.files.forEach(file => {
        let currentFile = eData.responsibilities.files.find(file => file.file === file.name);
        file.authors = currentFile.authors;
    })
};

const getFiles = () => {
    axios.get("https://archtoringbd.herokuapp.com/files").then(async (response) => {
        data = response.data;
        await addSocial();
        axios.put(`https://archtoringbd.herokuapp.com/files/${require('path').basename(process.cwd())}`, data).then((response) => {
            console.log(response);
        })
    })
};

getFiles();