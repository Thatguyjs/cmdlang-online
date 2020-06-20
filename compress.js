const Compress = {

	_program: "",
	_length: 0,
	_index: 0,

	_result: "",

	error: 0,


	// Compress a program
	run: function(program="") {
		this._program = program;
		this._length = program.length;
		this._index = 0;

		this._result = "";

		this.error = 0;

		while(!this.error && this._index < this._length) {
			this.next();
		}

		return {
			program: this._result,
			error: this.error
		};
	},


	// Compress the next instruction
	next: function() {
		switch(this._program[this._index]) {

			// Skip whitespace
			case ' ':
			case '\t':
			case '\r':
			case '\n':
				this._index++;
				break;


			// Skip comments
			case '/':
				while(this._program[this._index++] != '\n');
				break;


			// Single-character commands
			case '+':
			case '-':
			case '>':
			case '<':
			case '[':
			case ']':
			case ')':
			case ',':
			case '.':
			case ':':
			case '#':
			case ';':
				this._result += this._program[this._index++];
				break;


			// Jump points
			case '!':
				this._result += '!';

				while(this._program[this._index++] !== ';') {
					this._result += this._program[this._index];
				}
				break;

			case '@':
				this._result += '@';

				while(this._program[this._index++] !== ';') {
					this._result += this._program[this._index];
				}
				break;


			// Value comparison
			case '=':
				this._result += '=';

				while(this._program[this._index++] !== '(') {
					if(this._program[this._index] === ' ') continue;

					this._result += this._program[this._index];
				}
				break;


			// String output
			case '{':
				this._result += '{';

				while(this._program[this._index++] !== '}') {
					this._result += this._program[this._index];
				}
				break;


			// Include other files
			case '|':
				this.error = 1;
				break;


			// Print program memory
			case '$':
				this._result += '$';

				while(this._program[this._index++] !== ';') {
					if(this._program[this._index] === ' ') continue;

					this._result += this._program[this._index];
				}
				break;


			// Unknown character
			default:
				this.error = 2;

		}
	},


	// Get an error message from a code
	getMessage: function(code) {
		switch(code) {

			case 0:
				return "Success";

			case 1:
				return "External files not supported";

			case 2:
				return "Unknown character";

			default:
				return "Unknown Error";

		}
	}

};
