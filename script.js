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


function in_range(x, min, max) {
	return x >= min && x <= max;
}


const is_double_bpm = document.getElementById('is_double_bpm');
const specific_hold_length = parseFloat(document.getElementById('length_specific_hold').value);
function what_color(beat, i) {


	let ONE_FOURTH_GAP_COEFFICIENT = 1;
	if (is_double_bpm.checked) {
		ONE_FOURTH_GAP_COEFFICIENT = 0.5;
	}


	gap = Math.abs((beat[i + 1][1] - beat[i][1]) * beat[i][9] * 0.008333);  // fraction of a beat, e.g. 1/4 gap is 0.25

	// CHORD
	if (gap < 0.001) {
		let j = 1;

		gap = Math.abs((beat[i + j + 1][1] - beat[i + j][1]) * beat[i][9] * 0.008333);
		while (beat[i + j + 1][1] - beat[i + j][1] < 0.001) { j++; } // start at i+1, increment until next object not on same tick. j+i will be the last note of the chord, and j+1 will be the number of notes in a chord

		return ['chord', j];

	}

	// HOLD
	if (beat[i][5] == 1) {
		if (beat[i][6] == specific_hold_length) {
			return 'specific_hold';
		}
		if (beat[i][6] > gap + 0.001) {
			return 'anchor_hold';
		}
		if (beat[i][6] < gap - 0.001) {
			return 'disconnected_hold';
		}
		return 'hold';
	}

	// 1/3 AND 1/6
	if (in_range(gap, 0.32, 0.34) || in_range(gap, 0.145, 0.175) || in_range(gap, 0.65, 0.67)) {
		return 'third';
	}

	// JACK
	if (gap < 0.26 * ONE_FOURTH_GAP_COEFFICIENT && beat[i + 1][0] == beat[i][0]) {  // beat[i][0] is position

		let j = 1;
		gap = Math.abs((beat[i + j + 1][1] - beat[i + j][1]) * beat[i][9] * 0.008333);
		while (in_range(gap, 0.25 * ONE_FOURTH_GAP_COEFFICIENT - 0.001, 0.25 * ONE_FOURTH_GAP_COEFFICIENT + 0.001) && beat[i + j + 1][0] == beat[i + j][0]) { j++; }

		return ['jack', j];
	}

	// 1/4
	if (in_range(gap, 0.24 * ONE_FOURTH_GAP_COEFFICIENT, 0.26 * ONE_FOURTH_GAP_COEFFICIENT)) {
		return 'fourth';
	}

	// 1/8
	if (in_range(gap, 0.122 * ONE_FOURTH_GAP_COEFFICIENT, 0.127 * ONE_FOURTH_GAP_COEFFICIENT)) {
		return 'eighth';
	}

	return 'default';

}


// COLORING
function color(beat, timestamp_start, timestamp_end, hex_default, hex_2chord, hex_3chord, hex_jack, hex_stream, hex_third, hex_eighth, hex_hold, hex_anchor_hold, hex_disconnected_hold, hex_specific_hold, hex_chord_hold) {


	let setup_data = setup(beat, timestamp_start, timestamp_end);

	beat = setup_data.beat;
	let timestamp_index = setup_data.timestamp_index;

	beat.push([8, beat[beat.length - 1][1] + 1, false, 0, false, 0, 0.6741573033707865, 0, 0, 178, 64, 45, null, 0, 3, true, 0, 255]);  // inserting last note to not overflow and check index that doesn't exist
	console.log(beat);


	// i will change this eventually maybe??
	let hsv_default = hex_to_hsv(hex_default);
	let hsv_2chord = hex_to_hsv(hex_2chord);
	let hsv_3chord = hex_to_hsv(hex_3chord);
	let hsv_jack = hex_to_hsv(hex_jack);
	let hsv_stream = hex_to_hsv(hex_stream);
	let hsv_third = hex_to_hsv(hex_third);
	let hsv_eighth = hex_to_hsv(hex_eighth);
	let hsv_hold = hex_to_hsv(hex_hold);
	let hsv_anchor_hold = hex_to_hsv(hex_anchor_hold);
	let hsv_disconnected_hold = hex_to_hsv(hex_disconnected_hold);
	let hsv_specific_hold = hex_to_hsv(hex_specific_hold);
	let hsv_chord_hold = hex_to_hsv(hex_chord_hold);

	if (hsv_3chord === undefined) { hsv_3chord = hsv_2chord; }
	if (hsv_anchor_hold === undefined) { hsv_anchor_hold = hsv_hold; }
	if (hsv_disconnected_hold === undefined) { hsv_disconnected_hold = hsv_hold; }
	if (hsv_specific_hold === undefined) { hsv_specific_hold = hsv_hold; }
	if (hsv_chord_hold === undefined) { hsv_chord_hold = hsv_hold; }


	var color;
	for (i = timestamp_index[0]; i < timestamp_index[1] - 1; i++) {

		color = what_color(beat, i);
		// console.log(color);

		if (color.constructor === Array) {

			switch (color[0]) {
				case 'chord':
					for (idx = i; idx <= i + color[1]; idx++) {  // color[1] is the length of the chord not including the first note

						gap = Math.abs((beat[i + color[1] + 1][1] - beat[i][1]) * beat[i][9] * 0.008333);
						console.log(gap);
						// console.log(i, idx);
						if (beat[idx][5] == 1) {  // hold bypasses chords. i don't know how else to do this sorry
							if (beat[idx][6] == specific_hold_length && hsv_specific_hold != hsv_hold) {
								set_object_color(beat, idx, hsv_specific_hold, hsv_default);
							} else if (beat[idx][6] > gap + 0.001 && hsv_anchor_hold != hsv_hold) {
								set_object_color(beat, idx, hsv_anchor_hold, hsv_default);
							} else if (beat[idx][6] < gap - 0.001 && hsv_disconnected_hold != hsv_hold) {
								set_object_color(beat, idx, hsv_disconnected_hold, hsv_default);
							} else {
								set_object_color(beat, idx, hsv_chord_hold, hsv_default);
							}
						} else if (color[1] == 1) {
							set_object_color(beat, idx, hsv_2chord, hsv_default);
						} else {
							set_object_color(beat, idx, hsv_3chord, hsv_default);
						}

					}
					break
				case 'jack':
					for (idx = i; idx <= i + color[1]; idx++) {  // color[1] is the length of the chord not including the first note
						set_object_color(beat, idx, hsv_jack, hsv_default);
					}
					break

			}

			i += color[1];  // array is for object types where coloring spans several notes

		} else {

			switch (color) {
				case 'fourth':
					set_object_color(beat, i, hsv_stream, hsv_default);
					break
				case 'third':
					set_object_color(beat, i, hsv_third, hsv_default);
					break
				case 'eighth':
					set_object_color(beat, i, hsv_eighth, hsv_default);
					break
				case 'hold':
					set_object_color(beat, i, hsv_hold, hsv_default);
					break
				case 'anchor_hold':
					set_object_color(beat, i, hsv_anchor_hold, hsv_default);
					break
				case 'disconnected_hold':
					set_object_color(beat, i, hsv_disconnected_hold, hsv_default);
					break
				case 'specific_hold':
					set_object_color(beat, i, hsv_specific_hold, hsv_default);
					break
				case 'default':
					set_object_color(beat, i, hsv_default);
					break
			}

		}

	}

	beat.pop();  // remove note from earlier


	let output = JSON.stringify(beat);
	document.getElementById('color_output').innerHTML = output;

}


function set_object_color(beat, index, hsv, hsv_default) {

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
