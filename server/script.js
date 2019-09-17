const axios = require('axios');
const fs = require('fs');

let data = {};
let currentData = {};

const addSocial = async () => {
    currentData = data.find(project => project.name === require('path').basename(process.cwd())).data[0];
    currentData.files.forEach(f => {
        let eData = JSON.parse(fs.readFileSync('./inspector.json', 'utf16le').trim());
        let currentFile = eData.responsibilities.files.find(file => {
            return file.file.substring(file.file.indexOf("co/edu/")) === f.name
        });
        if (currentFile)
            f.authors = currentFile.authors;
    })
};

const getFiles = () => {
    axios.get("https://archtoringbd.herokuapp.com/files").then(async (response) => {
        data = response.data;
        await addSocial();
        fs.writeFileSync('./request.json', JSON.stringify(currentData));
        axios.put(`https://archtoringbd.herokuapp.com/files/${require('path').basename(process.cwd())}`, currentData).then((response) => {
            console.log(response);
        })
    })
};

getFiles();