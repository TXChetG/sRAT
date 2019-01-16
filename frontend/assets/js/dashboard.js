//TODO: Add Frontend notice regarding open quizzes on error.
const activateQuiz = function (qid, dashboard_root){
	var xhr = new XMLHttpRequest();
	xhr.open('PUT', `${dashboard_root}/quizzes/${qid}/open`, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({'qid': qid}));
	xhr.onload = function () {
		var response = JSON.parse(this.responseText);
		if (response.error) {
			console.error(`something broked: ${response.error}`);
		} else {
			let link = $(`.open_quiz[data-qid='${qid}']`);
			/*link.off('click').on('click', function (e) {
				let qid = $(this).attr('data-qid');
				deactivateQuiz(qid);
			});*/
			//link.html('Close');
			link.attr('disabled','disabled');
			link.siblings('.close_quiz').removeAttr('disabled');
			link.siblings('.view_quiz').removeAttr('disabled');
		}
	};
};

const deactivateQuiz = function (qid, dashboard_root){
	var xhr = new XMLHttpRequest();
	xhr.open('PUT', `${dashboard_root}/quizzes/${qid}/close`, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({'qid': qid}));
	xhr.onload = function () {
		var response = JSON.parse(this.responseText);
		if (response.error) {
			console.error(`something broked: ${response.error}`);
		} else {
			console.log(response);
			let link = $(`.close_quiz[data-qid='${qid}']`);
			/*link.off('click').on('click', function (e) {
				let qid = $(this).attr('data-qid');
				activateQuiz(qid);
			});*/
			//link.html('Open');
			link.attr('disabled','disabled');
			link.siblings('.view_quiz').attr('disabled','disabled');
			link.siblings('.open_quiz').removeAttr('disabled');
		}
	};
};

const buildQuizList = function (array, dashboard_root){
	array.forEach((quiz) => {
		//console.log(quiz);
		let id = quiz.quizid;
		let name = quiz.name;
		let quiz_row = `<div class="quiz__row">
			<div class="quiz__row__meta">
				<h4>${name}</h4>
			</div>
			<div class="quiz__row__actions">
				<button class="button open_quiz" data-qid="${id}">Open</button>
				<button class="button close_quiz" data-qid="${id}" disabled="disabled">Close</button>
				<a class="button view_quiz" href="${dashboard_root}/quizzes/${id}/view" disabled="disabled">View</a>
				<button class="button" disabled="disabled">Edit</button>
				<button class="button" disabled="disabled">Delete</button>
				<button class="button" disabled="disabled">Results</button>
			</div>
		</div>`;
	let quizList = jQuery('.quiz__list');
	quizList.append(quiz_row);
});
};
const getRequest = function ( dashboard_root ) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', dashboard_root + '/quizzes/list', true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send();
	xhr.onload = function () {
		var response = JSON.parse(this.responseText);
		if (response.error) {
			console.error(`something broked: ${response.error}`);
		} else {
			buildQuizList(response, dashboard_root);
			$('.open_quiz').click(function(e) {
				let qid = $(this).attr('data-qid');
				activateQuiz(qid, dashboard_root);
			});
			$('.close_quiz').click(function(e){
				let qid = $(this).attr('data-qid');
				deactivateQuiz(qid, dashboard_root);
			})
		}
	};
};