const Main = {

	// Program I/O & memory map
	program: document.getElementById('program'),
	input: document.getElementById('input'),
	output: document.getElementById('output'),
	memory: document.getElementById('memory-map'),


	// Buttons
	run: document.getElementById('run'),
	debug: document.getElementById('debug'),
	next: document.getElementById('next'),
	tobreak: document.getElementById('to-breakpoint'),


	// Add listeners
	init: function() {
		this.run.addEventListener('click', () => {
			Interpreter.load(this.program.value);
			Interpreter.start('run');
		});

		this.debug.addEventListener('click', () => {
			Interpreter.load(this.program.value);
			Interpreter.start('debug');
			Interpreter._updateMap(null, 0);
		});

		this.next.addEventListener('click', () => {
			if(!Interpreter.ready) return;
			Interpreter.resume();
			Interpreter.next();
		});

		this.tobreak.addEventListener('click', () => {
			if(!Interpreter.ready) return;
			Interpreter.resume();
			Interpreter.runTo('#');
		});

		this.input.addEventListener('keydown', (event) => {
			if(event.code === 'Enter') {
				if(Interpreter.getInput(Main.input.value) !== -1) {
					Main.input.value = "";
				}
			}
		});

		// Set up memory map
		for(let i = 0; i < 161; i++) {
			let container = document.createElement('div');

			container.appendChild(document.createElement('span'));
			container.appendChild(document.createElement('p'));
			container.children[1].innerText = i + 1;

			this.memory.appendChild(container);
		}

		// Set up interpreter
		Interpreter.init({
			output: this.output,
			memory: this.memory,
		});

		Interpreter._clearMemoryMap();
	}

};
