let chart;
let data;

const ctx = document.getElementById('chart');
const target_input = document.getElementById ('target-input');
const paragraph_x_equals = document.getElementById ('paragraph-x-equals');
const paragraph_x_more = document.getElementById ('paragraph-x-more');
const paragraph_x_less = document.getElementById ('paragraph-x-less');

const chart_options = {
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: false
		}
	},
	scales: {
		y: {
			ticks: {
				callback: value => `${value}%`
			}
		},
		x: {
			title: {
				display: true,
				text: 'No. of Successes',
				font: {
					size: 14
				}
			}
		}
	}
};


// Calculates combinations with optimization for large numbers
function calcCombinations (elements, set_size) {
	// e2 equals either set_size or (elements - set_size), whichever one is smaller
	// "e2" is an arbitrary name, absolutely can't think of what to name this
	let e2 = (set_size < elements - set_size) ? set_size : elements - set_size;

	let numerator = listFactorial (elements, e2);
	let denominator = listFactorial (e2, -1);

	let final = 1;
	for (let i = 0; i < numerator.length; i++)
		final = final * (numerator[i] / denominator[i]);

	final = Math.round (final);
	return final;
}

// Returns a list of [number, number - 1, ... , number - limit]
function listFactorial (number, limit) {
	if (number == 0 || number == 1 || limit == 0) {return [1];}
	if (limit == -1) {limit = number;} // allows to input limit as -1 to factorialize the whole number

	list = []
	for (i = 0; i < limit; i++) {
		list.push (number);
		number--;
	}

	return list;
}


// Safely multiplies, e.g., 1e2 * 1e-325 would normally evaluate to 0 instead of 1e-323, because of the minimal number limit
// Syntax: safeMultiply ([base1, power1], [base2, power2], ...)
function safeMultiply (...members) {
	let final = 1;
	
	// Alternate between numbers from all members and multiply them
	for (let i = Math.max (...members.map (item => item[1])); i > 0; i--) {
		members = members.filter (item => item[1] > 0);
		members.forEach(item => {
			final = final * item[0];
			item[1]--;
		});
	}

	return final;
}

function getData (probability, attempts) {
	const data = [];
	const calculated_combinations = {};
	let combinations;

	for (let i = 0; i <= attempts; i++) {
		if (i <= attempts / 2) {
			combinations = calcCombinations (attempts, i);
			calculated_combinations[i] = combinations;
		} else {
			combinations = calculated_combinations[attempts - i];
		}
	
		data[i] = {
			label: i,
			value: safeMultiply ([combinations, 1], [probability, i], [(1 - probability), (attempts - i)]) * 100
		}
	}

	return data;
}

function showChart (probability, attempts) {
	if (probability == '' || attempts == '') {return}

	// Clear the chart
	if (chart) {chart.destroy ();}

	// Get an array of calculated values
	data = getData (probability, attempts);

	// Strip data with a set threshold
	const largest = Math.max (...(data.map (item => item.value)));
	const stripped_data = data.filter (item => item.value > largest * 0.01);

	// Display the chart
	chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: stripped_data.map (item => item.label),
			datasets: [{
				label: 'Probability',
				data: stripped_data.map (item => `${item.value}`),
				backgroundColor: 'rgba(90, 120, 162, 0.8)'
			}]
		},
		options: chart_options
	});

	// Erase target (x) text
	target_input.value = null;
	paragraph_x_less.innerText = 'P(X < x):';
	paragraph_x_equals.innerText = 'P(X = x):';
	paragraph_x_more.innerText = 'P(X > x):';
}

function showTarget (target) {
	if (!chart || target == '') {return}
	if (target < 0 || target >= data.length) {
		// todo
		alert ("Invalid ");
		return;
	}

	const x_less_text = data.filter (item => item.label < target).map (item => item.value).reduce ((a, b) => a + b, 0);
	paragraph_x_less.innerText = `P(X < x): ${x_less_text.toFixed (3)}%`;

	const x_equals_text = data.filter (item => item.label == target).map (item => item.value).reduce ((a, b) => a + b, 0);
	paragraph_x_equals.innerText = `P(X = x): ${x_equals_text.toFixed (3)}%`;

	const x_more_text = data.filter (item => item.label > target).map (item => item.value).reduce ((a, b) => a + b, 0);
	paragraph_x_more.innerText = `P(X > x): ${x_more_text.toFixed (3)}%`;

	// Highlight the target bar
	chart.data.datasets[0].backgroundColor =
		bar => chart.data.labels[bar.index] == target ? 'rgba(60, 72, 103, 0.8)' : 'rgba(90, 120, 162, 0.8)';
	chart.update ();
}

document.onkeyup = (e) => {
	let event = (e || window.event);
	if (event.code == "Enter") {
		document.querySelectorAll("button").forEach (item => {
			item.addEventListener('focus', (e) => e.target.blur ())
		});
		showChart (document.getElementById('probability-input').value, document.getElementById('attempts-input').value);
	}
}