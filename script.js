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


		// ms to s conversion
		timestamp_start = timestamp_start / 1000;
		timestamp_end = timestamp_end / 1000;

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



	let setup_data = setup(beat, timestamp_start, timestamp_end);

	beat = setup_data.beat;
	let timestamp_index = setup_data.timestamp_index;

	console.log(beat);


	let to_color = [];
	let chord_counter = 0;
	let stream_start = false;
	let jack_start = false;
	for (i = timestamp_index[0]; i < timestamp_index[1]; i++) {

		if (i != 0) {  // don't check index -1


			// STREAMS
			if (beat[i][1] < beat[i - 1][1] + 30 / beat[i - 1][9] + 0.002) {  // 1/4 snap away or less

				if (beat[i][0] == beat[i - 1][0]) {
					jack_start = true;
					to_color.push([i - 1, 'jack']);

					if (i == beat.length - 1) {  // last item
						to_color.push([i, 'jack']);
					}
				} else {
					stream_start = true;
					to_color.push([i - 1, 'stream']);

					if (i == beat.length - 1) {  // last item
						to_color.push([i, 'stream_end']);
					}
				}

				// console.log(String(i - 1) + ' is a stream because ' + String(beat[i][1]) + ' < ' + String(beat[i - 1][1] + 30 / beat[i - 1][9] + 0.002));
			}

			if (beat[i][0] != beat[i - 1][0] && jack_start) {  // end of jacks
				if (jack_start == true) {
					jack_start = false;
					to_color.push([i - 1, 'jack']);
					stream_start = false;
				}
			}

			if (!(beat[i][1] < beat[i - 1][1] + 30 / beat[i - 1][9] + 0.002) && stream_start == true) {
				stream_start = false;
				to_color.push([i - 1, 'stream_end']);
			}


			// CHORD
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

	to_color.map(element => {

		switch (element[1]) {
			case 'chord':
				if (element[2] == 2 && hsv_2chord != undefined) {
					beat[element[0]][11] = hsv_2chord.h;
					beat[element[0]][16] = hsv_2chord.s;
					beat[element[0]][17] = hsv_2chord.v;
				} else if (element[2] >= 3 && hsv_3chord != undefined) {
					beat[element[0]][11] = hsv_3chord.h;
					beat[element[0]][16] = hsv_3chord.s;
					beat[element[0]][17] = hsv_3chord.v;
				}
			case 'jack':
				if (hsv_jack != undefined) {
					beat[element[0]][11] = hsv_jack.h;
					beat[element[0]][16] = hsv_jack.s;
					beat[element[0]][17] = hsv_jack.v;
				}
				break
			case 'stream':
				if (hsv_stream != undefined) {
					beat[element[0]][11] = hsv_stream.h;
					beat[element[0]][16] = hsv_stream.s;
					beat[element[0]][17] = hsv_stream.v;
				}
				break
			case 'stream_end':
				if (hsv_stream_end != undefined) {
					beat[element[0]][11] = hsv_stream_end.h;
					beat[element[0]][16] = hsv_stream_end.s;
					beat[element[0]][17] = hsv_stream_end.v;
				}

		}
	})

	let output = JSON.stringify(beat);
	document.getElementById('color_output').innerHTML = output;

}


function transition(item) {
	const tools = ['blank', 'horizontal-flip', 'color'];
	tools.forEach(element => {
		if (element != item) {
			document.getElementById(element).style.display = 'none';
		} else {
			document.getElementById(element).style.display = 'flex';
		}
	})
}

// document.onload = transition(blank);
