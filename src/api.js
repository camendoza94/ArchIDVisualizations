import axios from 'axios';
import * as Octokit from '@octokit/rest';

export function getProjects() {
    return axios.get("https://archtoringbd.herokuapp.com/architecture").then(response => {
        return response.data;
    });
}

export function getFiles() {
    return axios.get("https://archtoringbd.herokuapp.com/files").then(response => {
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

export function getHistory() {
    return axios.get("https://archtoringbd.herokuapp.com/history").then(response => {
        return response.data;
    });
}

export function getFromAzure(url, path) {
    const user = process.env.REACT_APP_AUTH_AZURE_USER;
    const secret = process.env.REACT_APP_AUTH_AZURE_SECRET;
    const tokenBase64 = 'Basic ' + btoa(user + ':' + secret);
    const parts = url.split("/");
    const org = parts[parts.length - 4];
    const project = parts[parts.length - 3];
    const repoName = parts[parts.length - 1];
    return axios({
        method: "get",
        url: `https://dev.azure.com/${org}/${project}/_apis/git/repositories/${repoName}/items?path=${path}&api-version=5.1`,
        headers: {
            'Authorization': tokenBase64,
            'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
        }
    }).then(response => {
        return response.data;
    });
}

export function getFromGithub(url, path) {
    const clientWithAuth = new Octokit({
        auth: process.env.REACT_APP_AUTH_GITHUB_SECRET
    });
    const parts = url.split("/");
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];
    clientWithAuth.repos.getContents({
        owner,
        repo,
        path
    }).then(response => console.log(response)) //TODO return response
}