import $ from 'jquery';
import 'what-input';

// Foundation JS relies on a global varaible. In ES6, all imports are hoisted
// to the top of the file so if we used`import` to import Foundation,
// it would execute earlier than we have assigned the global variable.
// This is why we have to use CommonJS require() here since it doesn't
// have the hoisting behavior.
window.jQuery = $;
require('foundation-sites');

// If you want to pick and choose which modules to include, comment out the above and uncomment
// the line below
//import './lib/foundation-explicit-pieces';

//Helper Functions for sRAT Frontend

const add_question = (selector, button) => {
	let i = $(selector).length;
	let question_template = `<article class="quiz__question">
			<label>Question Text:
			<input type="text" name="question_${i}">
		</label>
		<label>First Answer Choice:
			<input type="text" name="q${i}_answer_0">
		</label>
		<label>Second Answer Choice:
			<input type="text" name="q${i}_answer_1">
		</label>
		<label>Third Answer Choice:
			<input type="text" name="q${i}_answer_2">
		</label>
		<label>Fourth Answer Choice:
			<input type="text"  name="q${i}_answer_3">
		</label>
		<label>Correct Answer Choice:
			<select name="q${i}_correct">
				<option value="0">1</option>
				<option value="1">2</option>
				<option value="2">3</option>
				<option value="3">4</option>
			</select>
		</label>
	</article>`;
	$(button).before(question_template);
};

const add_teammate = (selector, insert) => {
	let i = $(selector).length;
	let teammate_template = `<label>Team Member Name:
			<input type="text" name="teammate${i}">
		</label>`;
	$(insert).append(teammate_template);
};


$(document).foundation();

$('.quiz').ready(() => {
	$('.button').click(function () {
		if ($(this).hasClass('correct')) {
			$(this).attr('disabled', 'disabled');
			$(this).siblings('.button').attr('disabled', 'disabled');
		} else if ($(this).hasClass('incorrect')) {
			$(this).attr('disabled', 'disabled');
		}
	});
});

$('.add-quiz').ready(() => {
	$('.button__add-question').click((e) => {
		e.preventDefault();
		add_question('.quiz__question', '.button__add-question');
	});
});

$('.add-team').ready(() => {
	$('.button__add_teammate').click((e) => {
		e.preventDefault();
		add_teammate('.add__teammate', '.teammate__new');
	});
});