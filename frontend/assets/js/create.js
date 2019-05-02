/* globals XMLHttpRequest, $, window */
/* eslint no-unused-vars: off */

let formToJSON = function formToJSON(elements) {
    return [].reduce.call(elements, function (data, element) {
        if (element.type !== 'submit') {
            data[element.name] = element.value;
        }

        return data;
    }, {});
};

// JS helpers for creating quizzes.

const dashboard_redirect = function () {
    let current_url = window.location.href,
        elements = current_url.split('/'),
        redirect_path = elements.splice(0, elements.length - 2).join('/');
    window.location = redirect_path;
};

const sendNewQuiz = function (data) {
    let xhr = new XMLHttpRequest();
    xhr.open('PUT', window.location, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
    xhr.onload = function () {
        let response = JSON.parse(this.responseText);
        if (response.error) {
            console.error(response.error);
        } else {
            console.log(response);
            //dashboard_redirect();
        }
    };
};

const createNewQuiz = (e, form) => {
    let formObj = $(form);
    const data = formToJSON(formObj[0].elements);
    // console.log(JSON.stringify(data, null, " "));
    // console.log(data);
    let api_data = {
        'name': data.quiz_title,
        'questions': []
    };

    const dataProps = Object.getOwnPropertyNames(data);
    console.log(dataProps);
    const questionList = dataProps.filter( property => {
        if ( property.match(/question_\d+/) ){
            return true;
        }
    });
    //console.log(questionList);

    const questionObjtoJSON = (array, data) => {
        const questionArray = [];
        for(let i = 0; i < array.length; i++){
            let obj = {};
            let q = array[i];
            obj.statement = data[q];
            obj.correct = (parseInt(data['q' + i + '_correct']) + 1);
            obj.answers = [];
            obj.answers.push(data['q' + i + '_answer_0'],data['q' + i + '_answer_1'],data['q' + i + '_answer_2'],data['q' + i + '_answer_3']);
            questionArray.push(obj);
        }
        return questionArray;
    };

    api_data.questions = questionObjtoJSON(questionList, data);
    console.log(api_data);

    sendNewQuiz(api_data);
};

// JS Helpers for adding new teams.

const sendNewTeam = data => {
    let xhr = new XMLHttpRequest();
    xhr.open('PUT', window.location, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
    xhr.onload = function () {
        let response = JSON.parse(this.responseText);
        if (response.error) {
            console.error(response.error);
        } else {
            console.log(response.teamcode);
            const showTeamId = (response) => {
                let teamcode = response.teamcode;
                $('.team__code').removeClass('hide').children('.button').before(`<p>${teamcode}</p>`);
            };
            showTeamId(response);
        }
    };
};

const createNewTeam = (e, form) => {
    e.preventDefault();
    let formObj = $(form);
    const data = formToJSON(formObj[0].elements);
    let api_data = {
        'name': data.team_name
    };
    sendNewTeam(api_data);
};