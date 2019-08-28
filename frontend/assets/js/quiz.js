/* globals XMLHttpRequest, jQuery, $ */
/* eslint no-unused-vars: off */

const checkAnswer = function (qid, aid, button, teamcode, quizid) {
    let postData = {
        proposed: aid
    };
    let xhr = new XMLHttpRequest();
    xhr.open('POST', teamcode + '/quizzes/' + quizid + '/' + qid + '/check', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(postData));
    xhr.onload = function () {
        let response = JSON.parse(this.responseText);
        if (response.error) {
            console.error(response.error);
        } else {
            if (response.iscorrect) {
                button.addClass('correct');
                button.attr('disabled', 'disabled');
                button.siblings().attr('disabled', 'disabled');
            } else {
                button.addClass('incorrect');
                button.attr('disabled', 'disabled');
            }
        }
    };
};

const buildAnswers = function (id, answers, teamcode, quizid) {
    answers.forEach((answer) => {
        let qid = id;
        let statement = answer.statement;
        let aid = answer.answerid;
        let answerTemplate = `<button class="button question__choice" data-qid=
			"${qid}" data-aid="${aid}">${statement}</button>`;
        jQuery(`.question_${qid} > .question__choices`).append(answerTemplate);
        jQuery(`.question__choice[data-qid='${qid}'][data-aid='${aid}']`).click(function () {
            checkAnswer(qid, aid, $(this), teamcode, quizid);
        });
    });
};

const buildQuiz = function (data, teamcode, quizid) {
    let title = data.name;
    jQuery('.quiz__title').text(title);

    // Print the questions and answers
    let questions = data.questions;
    questions.forEach((question) => {
        let statement = question.statement;
        let qid = question.questionid;
        let questionTemplate = `<div class="quiz__question question_${qid}" data-correct="false" data-qid="${qid}">
			<p class="question__stem">${statement}</p>
			<div class="question__choices stacked-for-small button-group"></div>
		</div>`;
        $('.quiz__container').append(questionTemplate);
        buildAnswers(qid, question.answers, teamcode, quizid);
    });
};

const buildEdit = function (data, quizid) {
    let title = data.name;
    let questions = data.questions;
    $('input[name="quiz_title"]').attr('value', title);
    questions.forEach((question) => {
        let statement = question.statement;
        let qid = question.questionid;
        let answerBlock = '';

        console.log(question);

        question.answers.forEach((answer) => {
            let statement = answer.statement;
            let aid = answer.answerid;
            let num = '';

            switch (aid) {
                case 1:
                    num = 'First';
                    break;
                case 2:
                    num = 'Second';
                    break;
                case 3:
                    num = 'Third';
                    break;
                case 4:
                    num = 'Fourth';
                    break;

                default:
                    break;
            }

            let answerTemplate = `<label>${num} Answer Choice:
            <input type="text" name="q${qid}_answer_${aid}" value="${answer.statement}">
          </label>`;

            answerBlock += answerTemplate;
        });

        let questionTemplate = `<article class="quiz__question" data-quizid="${data.quizid}">
          <label>Question Text:
            <input type="text" name="question_${qid}" value="${statement}">
          </label>
          ${answerBlock}
          <label>Correct Answer Choice:
            <select name="q0_correct">
              <option value="0">1</option>
              <option value="1">2</option>
              <option value="2">3</option>
              <option value="3">4</option>
            </select>
          </label>
        </article>`;
        $('.quiz__questions').children('.button__add-question').before(questionTemplate);
    });
}

const getRequest = function (teamcode, quizid, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', teamcode + '/quizzes/' + quizid, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    xhr.onload = function () {
        let response = JSON.parse(this.responseText);
        if (response.error) {
            console.error(`something broked: ${response.error}`);
        } else {
            callback(response, teamcode, quizid);
            return true;
        }
    };
};