function flip(beat, timestamp_start, timestamp_end) {


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
				timestamp_index[i] = j;  // timestamp is judged relative to 120bpm, so 0.5s per beat
			}
		}

		if (timestamp_index[0] == '') {
			timestamp_index[0] = 0;
		}
		if (timestamp_index[1] == '') {
			timestamp_index[1] = beat.length;
		}


		// 0 1 2 3 4 5 6 7 8
		// 2 1 0 5 4 3 8 7 6
		const position_output = [2, 1, 0, 5, 4, 3, 8, 7, 6]

		var modified_position = '';
		for (i = timestamp_index[0]; i < timestamp_index[1]; i++) {
			modified_position = position_output[beat[i][0]];
			beat[i][0] = modified_position;
		}


		let output = '[['
		for (i = 0; i < beat.length; i++) {
			output += beat[i].toString() + '], ['
		}
		output = output.slice(0, -4);
		output += ']]';


		console.log(beat);
		document.getElementById('output').innerHTML = output;

	}

}
