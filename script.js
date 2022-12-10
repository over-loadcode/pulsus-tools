function timestamp_to_ms(timestamp) {

	a = timestamp.split(/[:.]+/).map(element => Number(element));  // split by either : or .

	var minutes;
	var seconds;
	var milliseconds;

	if (a.length == 3) {
		minutes = a[0];
		seconds = a[1];
		milliseconds = a[2];
	} else if (a.length == 2) {
		minutes = 0;
		seconds = a[0];
		milliseconds = a[1];
	} else {
		return undefined;
	}

	return minutes * 60 + seconds + milliseconds * 0.001;

}

function setup(beat, timestamp_start, timestamp_end) {
	if (beat != '') {

		// turning str input to array
		beat = beat.split('[')

		beat = beat.map(element => element.replace(/\s/g, '').slice(0, -2).split(','));  // remove spaces, split at commas
		beat.splice(0, 2);
		// beat[beat.length - 1][17] = beat[beat.length - 1][17].slice(0, -1);  // contains extra ] otherwise and gets treates as bool in below section?

		// make strings to floats etc
		for (i = 0; i < beat.length; i++) {
			beat[i] = beat[i].map(element => {
				if (!isNaN(parseFloat(element)) && isFinite(element)) {  // isNumeric
					return parseFloat(element);
				} else {
					if (element == 'false') {
						return false;
					}
					if (element == 'true') {
						return true;
					}
				}
			});
		}


		// timestamp to s conversion
		timestamp_start = timestamp_to_ms(timestamp_start);
		timestamp_end = timestamp_to_ms(timestamp_end);

		beat.sort((a, b) => a[1] - b[1]);  // sort beat by time, which is zt.beat[i][1]

		var timestamp_index = [];
		var current_timestamp = 0;
		for (i = 0; i < 2; i++) {
			current_timestamp = [timestamp_start, timestamp_end][i];
			if (current_timestamp == '') {
				timestamp_index[i] = '';
			} else {
				for (j = 0; j < beat.length && beat[j][1] / 2 <= current_timestamp; j++) { }
				timestamp_index[i] = j;  // timestamp is judged relative to 120bpm, so 0.5s per beat. 
			}
		}

		if (timestamp_index[0] == '') {
			timestamp_index[0] = 0;
		}
		if (timestamp_index[1] == '') {
			timestamp_index[1] = beat.length;
		}

		return { beat, timestamp_index };

	}

}


// HORIZONTAL FLIP
function flip(beat, timestamp_start, timestamp_end) {


	let setup_data = setup(beat, timestamp_start, timestamp_end);

	beat = setup_data.beat;
	let timestamp_index = setup_data.timestamp_index;


	// 0 1 2 3 4 5 6 7 8
	// 2 1 0 5 4 3 8 7 6
	const position_output = [2, 1, 0, 5, 4, 3, 8, 7, 6]

	var modified_position = '';
	for (i = timestamp_index[0]; i < timestamp_index[1]; i++) {
		modified_position = position_output[beat[i][0]];
		beat[i][0] = modified_position;
	}


	// let output = '[['
	// for (i = 0; i < beat.length; i++) {
	// 	output += beat[i].toString() + '], ['
	// }
	// output = output.slice(0, -4);
	// output += ']]';

	let output = JSON.stringify(beat);
	document.getElementById('flip_output').innerHTML = output;

}


const hue_coefficient = 0.708333333; // 255/360
const hue_coefficient_recip = 1.41176471; // 360/255

function hex_to_hsv(hex) {

	hex = hex.replace(/[^a-z0-9]/gi, '');

	if (hex.length != 6) {
		return;
	}

	if (hex == '000000') {
		return undefined;
	}

	r = parseInt(hex.substr(0, 2), 16);
	g = parseInt(hex.substr(2, 2), 16);
	b = parseInt(hex.substr(4, 2), 16);

	// http://www.javascripter.net/faq/rgb2hsv.htm nobody tell him
	if (r == null || g == null || b == null ||
		isNaN(r) || isNaN(g) || isNaN(b)) {
		alert('Please enter numeric RGB values!');
		return;
	}
	if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) {
		alert('RGB values must be in the range 0 to 255.');
		return;
	}
	r = r / 255; g = g / 255; b = b / 255;
	var minRGB = Math.min(r, Math.min(g, b));
	var maxRGB = Math.max(r, Math.max(g, b));


	// Black-gray-white
	if (minRGB == maxRGB) {
		h = 0;
		s = 0;
		v = 255 * minRGB;

		return { h, s, v };

	}

	// Colors other than black-gray-white:
	var d = (r == minRGB) ? g - b : ((b == minRGB) ? r - g : b - r);
	var h = (r == minRGB) ? 3 : ((b == minRGB) ? 1 : 5);

	h = 60 * (h - d / (maxRGB - minRGB));
	s = (maxRGB - minRGB) / maxRGB;
	v = maxRGB;


	h = Math.round(h * hue_coefficient);
	s = Math.round(255 * s);
	v = Math.round(255 * v);

	return { h, s, v };

}

function hsv_to_hex([h, s, v]) {

	h = h * hue_coefficient_recip;
	s = s / 255;
	v = v / 255;

	// console.log(h,s,v)

	let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);  // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately. ?????????????????????????????????
	r = Math.round(f(5) * 255);
	g = Math.round(f(3) * 255);
	b = Math.round(f(1) * 255);

	// console.log(r, g, b);

	var hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

	// console.log(hex);
	return hex;

}


function in_range(x, min, max) {
	return x >= min && x <= max;
}


var specific_hold_length;
function hold_type(hold_length, gap, bpm, default_type) {  // returns type of hold given hold length and time until next note

	specific_hold_length = document.getElementById('length_specific_hold').value;  // it won't work if i set it outside the function idk why
	hold_length = hold_length * bpm * 0.008333;
	if (hold_length == specific_hold_length) {
		return 'specific_hold';
	}
	if (hold_length > gap + 0.001) {
		return 'anchor_hold';
	}
	if (hold_length < gap - 0.001) {
		console.log(hold_length, gap);
		return 'disconnected_hold';
	}
	return default_type;

}

function get_gap(current_note, next_note) {  // fraction of a beat, e.g. 1/4 gap is 0.25

	return Math.abs((next_note[1] - current_note[1]) * current_note[9] * 0.008333);

}

var to_color;  // format is [index, color]
const is_double_bpm = document.getElementById('is_double_bpm');
function find_color(beat, i) {

	let ONE_FOURTH_GAP_COEFFICIENT = 1;
	if (is_double_bpm.checked) {
		ONE_FOURTH_GAP_COEFFICIENT = 0.5;
	}

	gap = get_gap(beat[i], beat[i + 1]);

	// CHORD
	if (gap < 0.001) {

		j = 1;
		while (beat[i + j + 1][1] - beat[i + j][1] < 0.001) { j++; }  // start at i+1, increment until next object not on same tick. j+i will be the last note of the chord, and j+1 will be the number of notes in a chord
		return j + i;

	}

	// HOLD
	if (beat[i][5] == 1) {
		to_color.push([i, hold_type(beat[i][6], gap, beat[i][9], 'hold')]);
		return;
	}

	// 1/3 AND 1/6
	if (in_range(gap, 0.32, 0.34) || in_range(gap, 0.145, 0.175) || in_range(gap, 0.65, 0.67)) {
		to_color.push([i, 'third']);
		return;
	}

	// JACK
	if (gap < 0.26 * ONE_FOURTH_GAP_COEFFICIENT && beat[i + 1][0] == beat[i][0]) {  // beat[i][0] is position

		to_color.push([i, 'jack']);
		to_color.push([i + 1, 'jack']);
		return;

	}

	// 1/4
	if (in_range(gap, 0.24 * ONE_FOURTH_GAP_COEFFICIENT, 0.26 * ONE_FOURTH_GAP_COEFFICIENT)) {
		to_color.push([i, 'fourth']);
		return;
	}

	// 1/8
	if (in_range(gap, 0.122 * ONE_FOURTH_GAP_COEFFICIENT, 0.127 * ONE_FOURTH_GAP_COEFFICIENT)) {
		to_color.push([i, 'eighth']);
		return;
	}

	to_color.push([i, 'default']);
	return;

}


// COLORING
function color(beat, timestamp_start, timestamp_end) {


	document.getElementById('color_output').value = '';

	let setup_data = setup(beat, timestamp_start, timestamp_end);

	beat = setup_data.beat;
	let timestamp_index = setup_data.timestamp_index;

	beat.push([8, beat[beat.length - 1][1] + 1, false, 0, false, 0, 0.6741573033707865, 0, 0, 178, 64, 45, null, 0, 3, true, 0, 255]);  // inserting last note to not overflow and check index that doesn't exist
	// console.log(beat);

	to_color = [];
	var color_inputs = document.querySelectorAll('input[type="color"]');
	var colors = {};

	color_inputs.forEach(element => {
		colors[element.id.substring(6)] = hex_to_hsv(element.value);
	});

	if (colors['3chord'] === undefined) { colors['3chord'] = colors['2chord']; }
	if (colors.anchor_hold === undefined) { colors.anchor_hold = colors.hold; }
	if (colors.disconnected_hold === undefined) { colors.disconnected_hold = colors.hold; }
	if (colors.specific_hold === undefined) { colors.specific_hold = colors.hold; }
	if (colors.chord_hold === undefined) { colors.chord_hold = colors.hold; }

	var color;
	for (i = timestamp_index[0]; i < timestamp_index[1] - 1; i++) {

		color = find_color(beat, i);
		if (color != undefined) {  // chord
			for (j = i; j <= color; j++) {
				if (beat[j][5] == 1) {
					// console.log(beat[i]);
					gap = get_gap(beat[color], beat[color + 1]);
					to_color.push([j, hold_type(beat[j][6], gap, beat[j][9], 'chord_hold')]);
				} else if (color - j > 1) {
					to_color.push([j, '3chord']);
				} else {
					to_color.push([j, '2chord']);
				}
			}
			i = j - 1;
		}

	}

	var current_color;
	to_color.forEach(element => {

		current_color = colors[element[1]];
		set_object_color(beat, element[0], current_color, colors.default, colors.excluded);

	})
	console.log(colors);
	console.log(to_color);


	beat.pop();  // remove note from earlier


	let output = JSON.stringify(beat);
	document.getElementById('color_output').value = output;

}


function grab_colors(beat, timestamp_start, timestamp_end) {

	document.getElementById('color_output').value = '';

	let setup_data = setup(beat, timestamp_start, timestamp_end);

	beat = setup_data.beat;
	let timestamp_index = setup_data.timestamp_index;

	// console.log(beat);

	// inserting last note to not overflow and check index that doesn't exist
	if (beat[beat.length - 1][5] == 1) {
		beat.push([8, beat[beat.length - 1][1] + beat[beat.length - 1][6], false, 0, false, 0, 0.6741573033707865, 0, 0, 178, 64, 45, null, 0, 3, true, 0, 255]);
	} else {
		beat.push([8, beat[beat.length - 1][1] + 1, false, 0, false, 0, 0.6741573033707865, 0, 0, 178, 64, 45, null, 0, 3, true, 0, 255]);
	}

	to_color = [];


	var color;
	for (i = timestamp_index[0]; i < timestamp_index[1] - 1; i++) {

		color = find_color(beat, i);
		if (color != undefined) {  // chord
			for (j = i; j <= color; j++) {
				if (beat[j][5] == 1) {
					gap = get_gap(beat[color], beat[color + 1]);
					to_color.push([j, hold_type(beat[j][6], gap, beat[j][9], 'chord_hold')]);
				} else if (color - i > 1) {
					to_color.push([j, '3chord']);
				} else {
					to_color.push([j, '2chord']);
				}
			}
			i = j - 1;
		}

	}


	// console.log(to_color);

	var color_inputs = document.querySelectorAll('input[type="color"]');
	var counts = {};

	var hsv;
	var type;
	to_color.forEach(element => {

		hsv = `${beat[element[0]][11]},${beat[element[0]][16]},${beat[element[0]][17]}`

		type = element[1];

		if (!counts[type]) {  // if note type doesn't exist
			counts[type] = {};
		}

		if (!counts[type][hsv]) {  // if count for that HSV doesn't exist
			counts[type][hsv] = {
				value: 0
			};
		}

		counts[type][hsv].value++;
		if (type == 'anchor_hold') {
			// console.log(beat[element[0]]);
		}

	});

	console.log(counts);

	let to_update = [];
	let push_hsv;
	for (const type in counts) {
		let most_frequent_hsv;
		let highest_count = 0;
		for (const hsv in counts[type]) {
			// update current highest count if the hsv has a higher value
			if (counts[type][hsv].value > highest_count) {
				most_frequent_hsv = hsv;
				highest_count = counts[type][hsv].value;
			}
		}
		push_hsv = most_frequent_hsv.split(',').map(element => parseInt(element));
		to_update.push([`color_${type}`, hsv_to_hex(push_hsv)]);
	}
	// console.log(to_update);

	to_update.forEach(element => {
		document.getElementById(element[0]).value = element[1];
	})

}


function set_object_color(beat, index, hsv, hsv_default, hsv_excluded) {

	if (hsv_excluded != undefined) {
		if (beat[index][11] == hsv_excluded.h && beat[index][16] == hsv_excluded.s && beat[index][17] == hsv_excluded.v) {
			return;
		}
	}

	if (hsv != undefined) {
		beat[index][11] = hsv.h;
		beat[index][16] = hsv.s;
		beat[index][17] = hsv.v;
	} else if (hsv_default != undefined) {
		beat[index][11] = hsv_default.h;
		beat[index][16] = hsv_default.s;
		beat[index][17] = hsv_default.v;
	}

}


var today = new Date();
var expiry = new Date(today.getTime() + 365 * 24 * 3600 * 1000); // plus 365 days

function setCookie(name, value) {
	document.cookie = name + '=' + escape(value) + '; path=/; expires=' + expiry.toGMTString();
}


// SAVE PRESET (COLOR)
function save_preset() {

	var color_inputs = document.querySelectorAll('input[type="color"]');
	color_inputs.forEach(element => { setCookie(element.id, element.value.slice(1)); });
	// console.log(document.cookie);

}


// DELETE
function delete_section(beat, timestamp_start, timestamp_end) {

	let setup_data = setup(beat, timestamp_start, timestamp_end);

	beat = setup_data.beat;
	let timestamp_index = setup_data.timestamp_index;

	if (timestamp_index[1] == beat.length - 1) {  // querk of splice IG
		beat.splice(timestamp_index[0], timestamp_index[1] - timestamp_index[0] + 1);  // its really just so easy for a guy like me
	} else {
		beat.splice(timestamp_index[0], timestamp_index[1] - timestamp_index[0]);  // its really just so easy for a guy like me
	}


	let output = JSON.stringify(beat);
	document.getElementById('delete_output').innerHTML = output;

}


function transition(item) {

	const tools = ['blank', 'horizontal-flip', 'color', 'delete'];
	tools.forEach(element => {
		if (element != item) {
			document.getElementById(element).style.display = 'none';
		} else {
			document.getElementById(element).style.display = 'flex';
		}
	})

	if (document.getElementById(item).offsetHeight > window.innerHeight) {
		document.getElementById(item).style.alignSelf = 'flex-start';
		// console.log('sdfsdf');
	}

}


function getCookie(cname) {  // taken from W3schools lol

	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');

	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}

		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";

}

// $(document).on('change', 'input[type=color]', function() {
// 	this.parentNode.style.backgroundColor = this.value;
// });

function document_setup() {

	var color_inputs = document.querySelectorAll('input[type="color"]');
	color_inputs.forEach(element => {
		document.getElementById(element.id).value = '#' + getCookie(element.id);
	})

}

document.onload = document_setup();
