const Interpreter = {

	// Interpreter state
	ready: false,
	mode: "",


	// Program data
	_program: "",
	_programLength: 0,
	_index: 0,


	// Active program
	_cells: null,
	_cell: 0,
	_jumps: [],


	// Program state
	_paused: false,
	_input: false,


	// Output & memory map
	_output: null,
	_memory: null,


	// Error code
	error: 0,


	// Clear the memory map
	_clearMemoryMap: function() {
		if(!this._memory) return;

		let length = this._memory.children.length;

		for(let i = 0; i < length; i++) {
			this._memory.children[i].className = '';
			this._memory.children[i].children[0].innerText = '000';
		}
	},


	// Update the memory map
	_updateMap: function(last, next) {
		if(last < 0 || next < 0) return;
		if(last > 160 || next > 160) return;
		if(last !== null) this._memory.children[last].className = "";

		this._memory.children[next].className = "selected";

		let value = this._cells[next].toString();
		value = '000'.slice(0, -value.length) + value;

		this._memory.children[next].children[0].innerText = value;
	},


	// Load resources
	init: function(options={}) {
		this._output = options.output || null;
		this._memory = options.memory || null;
	},


	// Load the program & mode
	load: function(program="") {
		if(!this._output) return;

		this.ready = false;

		this._program = Compress.run(program);
		this._programLength = this._program.length;
		this._index = 0;

		this._cells = new Uint32Array(30000);
		this._cell = 0;
		this._jumps = [];

		this._input = false;
		this._paused = false;

		this.error = 0;

		this._output.value = "";
		this._clearMemoryMap();

		if(this._program.error) {
			console.error("[Compress Error]:", Compress.getMessage(this._program.error));
			return;
		}
		else {
			this._program = this._program.program;
		}

		this.ready = true;
	},


	// Start interpreting the program
	start: function(mode="") {
		if(!this.ready) return;
		this.mode = mode;

		if(this.mode === 'run') {
			while(!this.error && !this._paused && this.ready) {
				this.next();
			}
		}
		else if(this.mode === 'debug') {
			this.pause();
		}
		else {
			this._output.value += "[Interpreter]: Unknown start mode\n";
		}
	},


	// Interpret the next command
	next: function() {
		if(this._index >= this._programLength) {
			this.ready = false;
			return;
		}

		if(this._paused) return;
		if(this._input) return;

		switch(this._program[this._index]) {

			// Increment / Decrement the current cell
			case '+':
				this._cells[this._cell]++;
				this._updateMap(null, this._cell);
				this._index++;
				break;

			case '-':
				this._cells[this._cell]--;
				this._updateMap(null, this._cell);
				this._index++;
				break;


			// Increment / Decrement the cell pointer
			case '>':
				this._updateMap(this._cell, ++this._cell);
				this._index++;
				break;

			case '<':
				this._updateMap(this._cell, --this._cell);
				this._index++;
				break;


			// Conditional loops
			case '[':
				if(this._cells[this._cell] === 0) {
					let depth = 0;

					while(this._program[++this._index] !== ']' || depth) {
						if(this._program[this._index] === '[') depth++;
						else if(this._program[this._index] === ']') depth--;
					}
				}
				else {
					this._index++;
				}
				break;

			case ']':
				if(this._cells[this._cell] === 0) {
					this._index++;
				}
				else {
					let depth = 0;

					while(this._program[--this._index] !== '[' || depth) {
						if(this._program[this._index] === ']') depth++;
						else if(this._program[this._index] === '[') depth--;
					}
				}
				break;


			// Create a new jump point
			case '!':
				{
					let name = "";

					while(this._program[this._index++] !== ';') {
						name += this._program[this._index];
					}

					let found = false;

					for(let j in this._jumps) {
						if(this._jumps[j].name === name) {
							found = true;
							break;
						}
					}

					if(!found) {
						this._jumps.push({
							name,
							index: this._index
						});
					}
				}
				break;

			case '@':
				{
					let name = "";

					while(this._program[this._index++] !== ';') {
						name += this._program[this._index];
					}

					for(let j in this._jumps) {
						if(this._jumps[j].name === name) {
							this._index = this._jumps[j].index;
							break;
						}
					}
				}
				break;


			// Value comparison
			case '=':
				{
					let number = '';

					while(this._program[++this._index] !== '(') {
						if(this._program[this._index] === ' ') continue;

						number += this._program[this._index];
					}

					if(this._cells[this._cell] === Number(number)) {
						this._index++;
					}
					else {
						let depth = 0;

						while(this._program[this._index++] !== ')' || depth) {
							if(this._program[this._index] === '(') depth++;
							else if(this._program[this._index] === ')') depth--;
						}
					}
				}
				break;


			// User input
			case ',':
				this.pause();
				this._input = true;
				this._index++;
				break;


			// Cell output
			case '.':
				this._output.value += String.fromCharCode(this._cells[this._cell]);
				this._index++;
				break;

			case ':':
				this._output.value += this._cells[this._cell];
				this._index++;
				break;


			// Debugging output
			case '{':
				while(this._program[this._index++] !== '}') {
					this._output.value += this._program[this._index];
				}
				break;


			// Include other files
			case '|':
				this.error = 2;
				break;


			// Breakpoint
			case '#':
				this.pause();
				this._output.value += 'Cell: ' + this._cell;
				this._output.value += ' value: ' + this._cells[this._cell] + '\n';
				this._index++;
				break;


			// Print memory
			case '$':
				{
					let range = ['', ''];

					while(this._program[this._index++] !== ',') {
						range[0] += this._program[this._index];
					}

					while(this._program[this._index++] !== ';') {
						range[1] += this._program[this._index];
					}

					range[0] = Number(range[0]);
					range[1] = Number(range[1]);

					while(range[0] < range[1]) {
						this._output.value += this._cells[range[0]] + ' ';
						range[0]++;
					}

					this._output.value += '\n';
				}
				break;


			// End program
			case ';':
				this.error = 3;
				break;


			// Unknown character
			default:
				this.error = 1;

		}
	},


	// Pause the interpreter
	pause: function() {
		this._paused = true;
	},


	// Resume the interpreter
	resume: function() {
		this._paused = false;
	},


	// Get input
	getInput: function(char='') {
		if(!this._input) return -1;

		this._cells[this._cell] = char.charCodeAt(0);
		this._updateMap(null, this._cell);

		this._input = false;
		this.resume();

		if(this.mode === 'run') this.next();
	},


	// Run the program until it reaches a certain command
	runTo: function(char) {
		while(this._program[this._index] !== char && this.ready && !this.error && !this._paused) {
			this.next();
		}

		this.pause();
	},


	// Get an error message from a code
	getMessage: function(code) {
		switch(code) {

			case 0:
				return "Success";

			case 1:
				return "Unknown character";

			case 2:
				return "Cannot include external files";

			case 3:
				return "Program terminated";

			default:
				return "Unknown Error";

		}
	}

};
