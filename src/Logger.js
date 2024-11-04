import kleur from "kleur";

class Logger {
	static log(...messages) {
		console.log(...messages);
	}

	// alias for log
	static message(...messages) {
		this.log(...messages);
	}

	static warning(...messages) {
		this.message(...(messages.map(msg => kleur.yellow(msg))));
	}

	static error(...messages) {
		this.message(...(messages.map(msg => kleur.red(msg))));
	}
}

export { Logger }