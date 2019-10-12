import axios from 'axios';

export function getProjects() {
    return axios.get("https://archtoringbd.herokuapp.com/architecture").then(response => {
        return response.data;
    });
}

export function getCategorization() {
    return axios.get("https://archtoringbd.herokuapp.com/categorization").then(response => {
        return response.data;
    });
}

export function getIssueDetail() {
    return axios.get("https://archtoringbd.herokuapp.com/issuesDetail").then(response => {
        return response.data;
    });
}

export function getFromAzure(repo, path) {
    const user = process.env.REACT_APP_AUTH_AZURE_USER;
    const secret = process.env.REACT_APP_AUTH_AZURE_SECRET;
    const tokenBase64 = 'Basic ' + btoa(user + ':' + secret);
    return axios({
        method: "get",
        url: `https://dev.azure.com/IntergrupoUniAndes/DemoProyectoJava/_apis/git/repositories/DemoProyectoJava/items?path=${path}&download=true&api-version=5.1`,
        headers: {
            'Authorization': tokenBase64,
            'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
        }
    }).then(response => {
        return response.data;
    });
}