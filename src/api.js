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