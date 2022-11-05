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
		let a = timestamp_start.split(/[:.]+/).map(element => Number(element));  // split by either : or .
		console.log(a);
		timestamp_start = a[0] * 60 + a[1] + a[2] * 0.001;
		a = timestamp_end.split(/[:.]+/).map(element => Number(element));
		timestamp_end = a[0] * 60 + a[1] + a[2] * 0.001;

		console.log(timestamp_start, timestamp_end);

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

// COLORING
function color(beat, timestamp_start, timestamp_end, hex_default, hex_2chord, hex_3chord, hex_jack, hex_stream, hex_stream_end) {

	const is_double_bpm = document.getElementById('is_double_bpm');

	let ONE_FOURTH_RHYTHM_COEFFICIENT = 30;
	if (is_double_bpm.checked) {
		ONE_FOURTH_RHYTHM_COEFFICIENT = 15;
	}

	let setup_data = setup(beat, timestamp_start, timestamp_end);

	beat = setup_data.beat;
	let timestamp_index = setup_data.timestamp_index;

	console.log(beat);


	let to_color = [];
	let chord_counter = 0;
	let on_stream = false;
	for (i = timestamp_index[0]; i < timestamp_index[1]; i++) {


		// STREAM
		if (i != beat.length - 1) {

			if (beat[i + 1][1] - beat[i][1] < ONE_FOURTH_RHYTHM_COEFFICIENT / beat[i][9] + 0.008 && beat[i + 1][1] - beat[i][1] > 0.008 && beat[i + 1][0] != beat[i][0] && beat[i - 1][0] != beat[i][0]) {  // within 1/4 rhythm of next note + 4ms, not in the same position, not on the same tick as the note before or after
				on_stream = true;
				to_color.push([i, 'stream']);
			}

			if (!(beat[i + 1][1] - beat[i][1] < ONE_FOURTH_RHYTHM_COEFFICIENT / beat[i][9] + 0.008 && beat[i + 1][1] - beat[i][1] > 0.008 && beat[i + 1][0] != beat[i][0]) && on_stream) {
				on_stream = false;
				to_color.push([i, 'stream_end']);
			}  // not within 1/4 rhythm of next note + 4ms, not in the same position, currently in stream. must be end of stream

		} else {

			if (on_stream) {  // last note
				to_color.push([i, 'stream_end']);
			}

		}


		// JACK
		if (i != beat.length - 1) {

			if (beat[i + 1][1] - beat[i][1] < ONE_FOURTH_RHYTHM_COEFFICIENT * 2 / beat[i][9] + 0.008 && beat[i + 1][1] - beat[i][1] > 0.008 && beat[i + 1][0] == beat[i][0]) {

				to_color.push([i, 'jack']);
				to_color.push([i + 1, 'jack']);

			}

		}


		// CHORD
		if (i != 0) {
			if (beat[i][1] >= beat[i - 1][1] - 0.008 && beat[i][1] <= beat[i - 1][1] + 0.008) {  // check if it's in a 4ms range before or after previous note
				chord_counter += 1;
			}

			if ((!(beat[i][1] >= beat[i - 1][1] - 0.008 && beat[i][1] <= beat[i - 1][1] + 0.008) || i == beat.length - 1) && chord_counter > 0) {  // pushing notes to chord when "chord streak" is broken

				if (i == beat.length - 1) {  // last item
					for (j = 0; j <= chord_counter; j++) {
						to_color.push([i - chord_counter + j, 'chord', chord_counter + 1]);
					}
				} else {
					for (j = 0; j <= chord_counter; j++) {
						to_color.push([i - chord_counter - 1 + j, 'chord', chord_counter + 1]);
					}
				}

				// [index of note, 'chord', length of chord]
				chord_counter = 0;
			}
		}
	}


	let hsv_default = hex_to_hsv(hex_default);
	let hsv_2chord = hex_to_hsv(hex_2chord);
	let hsv_3chord = hex_to_hsv(hex_3chord);
	let hsv_jack = hex_to_hsv(hex_jack);
	let hsv_stream = hex_to_hsv(hex_stream);
	let hsv_stream_end = hex_to_hsv(hex_stream_end);


	console.log(to_color);

	if (hsv_stream_end == undefined) {
		hsv_stream_end = hsv_stream;
	}

	if (hsv_default != undefined) {
		beat.map(element => {
			element[11] = hsv_default.h;
			element[16] = hsv_default.s;
			element[17] = hsv_default.v;
		})
	}

	console.log(hsv_2chord);
	to_color.map(element => {

		switch (element[1]) {
			case 'chord':
				if (element[2] == 2) {
					set_object_color(beat, element, hsv_2chord);
				} else if (element[2] >= 3) {
					set_object_color(beat, element, hsv_3chord);
				}
				break
			case 'jack':
				set_object_color(beat, element, hsv_jack);
				break
			case 'stream':
				set_object_color(beat, element, hsv_stream);
				break
			case 'stream_end':
				set_object_color(beat, element, hsv_stream_end);
				break

		}
	})

	let output = JSON.stringify(beat);
	document.getElementById('color_output').innerHTML = output;

}


function set_object_color(beat, element, hsv) {  // element refers to elements in to_color, where element[0] indicates the index of the object in beat
	if (hsv != undefined) {
		beat[element[0]][11] = hsv.h;
		beat[element[0]][16] = hsv.s;
		beat[element[0]][17] = hsv.v;
	}
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
}

// document.onload = transition(blank);

// $(document).on('change', 'input[type=color]', function() {
// 	this.parentNode.style.backgroundColor = this.value;
// });
