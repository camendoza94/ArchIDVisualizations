import axios from 'axios';


export function getProjects() {
    return axios.get("https://archtoringbd.herokuapp.com/architecture").then(response => {
        return response.data;
    });
}