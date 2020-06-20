window.addEventListener('load', () => {
	let textareas = [...document.getElementsByTagName('textarea')];

	for(let t in textareas) {
		textareas[t].addEventListener('keydown', (event) => {
			if(event.key === 'Tab') {
				textareas[t].setRangeText(
					'\t',
					textareas[t].selectionStart,
					textareas[t].selectionEnd,
					'end'
				);

				event.preventDefault();
			}
		});
	}

	Main.init();
});
