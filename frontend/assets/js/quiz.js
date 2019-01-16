	const checkAnswer = function(qid, aid, button, teamcode, quizid){
		let postData = {proposed: aid};
		var xhr = new XMLHttpRequest();
		xhr.open('POST', teamcode + '/quizzes/' + quizid + '/' + qid + '/check', true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send(JSON.stringify(postData));
		xhr.onload = function () {
			var response = JSON.parse(this.responseText);
			if (response.error) {
				console.error(response.error);
			} else {
				if (response.iscorrect){
					button.addClass('correct');
					button.attr('disabled','disabled');
					button.siblings().attr('disabled','disabled')
				} else {
					button.addClass('incorrect');
					button.attr('disabled','disabled');
				}
			}
		};
	};

	const buildAnswers = function (id, answers, teamcode, quizid){
		answers.forEach((answer) => {
			let qid = id;
			let statement = answer.statement;
			let aid = answer.answerid;
			let answerTemplate = `<button class="button question__choice" data-qid=
				"${qid}" data-aid="${aid}">${statement}</button>`;
			jQuery(`.question_${qid} > .question__choices`).append(answerTemplate);
			jQuery(`.question__choice[data-qid='${qid}'][data-aid='${aid}']`).click(function(e){
				checkAnswer(qid, aid, $(this), teamcode, quizid);
			});
		});
	};

	const buildQuiz = function (data, teamcode, quizid){
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
	const getRequest = function (teamcode, quizid) {
		var teamcode = teamcode;
		var quizid = quizid;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', teamcode + '/quizzes/' + quizid, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send();
		xhr.onload = function () {
			var response = JSON.parse(this.responseText);
			if (response.error) {
				console.error(`something broked: ${response.error}`);
			} else {
				buildQuiz(response, teamcode, quizid);
				return true;
			}
		};
	};