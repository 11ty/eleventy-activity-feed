import kleur from 'kleur';

import { Logger } from "./Logger.js";

class Activity {
	static UUID_PREFIX = "11tyaf";

	#fetcher;
	#outputFolder;

	setFetcher(fetcher) {
		this.#fetcher = fetcher;
	}

	get fetcher() {
		if(!this.#fetcher) {
			throw new Error("Missing Fetcher instance.");
		}
		return this.#fetcher;
	}

	setLabel(label) {
		this.label = label;
	}

	setFilepathFormatFunction(format) {
		if(typeof format !== "function") {
			throw new Error("filepathFormat option expected to be a function.");
		}
		this.filepathFormat = format;
	}

	getFilepathFormatFunction() {
		return this.filepathFormat;
	}

	isValidHttpUrl(url) {
		try {
			new URL(url);
			return url.startsWith("https://") || url.startsWith("http://");
		} catch(e) {
			// invalid url OR local path
			return false;
		}
	}

	setOutputFolder(dir) {
		this.#outputFolder = dir;
	}

	get outputFolder() {
		return this.#outputFolder;
	}

	toIsoDate(dateStr) {
		return (new Date(Date.parse(dateStr))).toISOString();
	}

	toReadableDate(dateStr, locale = 'en-US', options = {}) {
		options = Object.assign({
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
			timeZoneName: "short",
		}, options);

		let date = (new Date(Date.parse(dateStr)));
		return new Intl.DateTimeFormat(locale, options).format(date)
	}

	getHeaders() {
		return {};
	}

	getUniqueIdFromEntry() {
		return "";
	}

	// Thanks to https://stackoverflow.com/questions/7467840/nl2br-equivalent-in-javascript/7467863#7467863
	static nl2br(str) {
		if (typeof str === 'undefined' || str === null) {
			return "";
		}
		return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
	}

	async getData(url, type, showErrors = true) {
		return this.fetcher.fetch(url, {
			type,
			fetchOptions: {
				headers: this.getHeaders(),
			},
		}, showErrors);
	}

	async #getCleanedEntries(url, showErrors = true) {
		let entries = [];
		let data = await this.getData(url, this.getType(), showErrors);

		for(let entry of this.getEntriesFromData(data) || []) {
			let cleaned = await this.cleanEntry(entry, data);
			entries.push(cleaned);
		}

		return entries;
	}

	async getEntries() {
		let url = this.getUrl();
		let entries = [];
		if(typeof url === "function") {
			let pageNumber = 1;
			let pagedUrl;

			try {
				while(pagedUrl = url(pageNumber)) {
					let found = 0;
					for(let entry of await this.#getCleanedEntries(pagedUrl, false)) {
						entries.push(entry);
						found++;
					}
					if(found === 0) {
						break;
					}

					pageNumber++;
				}
			} catch(e) {
				let shouldWorry = await this.isErrorWorthWorryingAbout(e);
				if(shouldWorry) {
					Logger.error(kleur.red(`Error: ${e.message}`), e);
					throw e;
				}
			}
		} else if(typeof url === "string" || url instanceof URL) {
			for(let entry of await this.#getCleanedEntries(url) || []) {
				entries.push(entry);
			}
		}

		return entries.map(entry => {
			// TODO check uuid uniqueness

			if(this.label) {
				entry.sourceLabel = this.label;
			}

			// create Date objects
			if(entry.date) {
				entry.date = new Date(Date.parse(entry.date));
			}

			if(entry.dateUpdated) {
				entry.dateUpdated = new Date(Date.parse(entry.dateUpdated));
			}

			Object.defineProperty(entry, "source", {
				enumerable: false,
				value: this,
			});

			return entry;
		});
	}

	cleanStatus(status) {
		// WordPress has draft/publish
		// For future use
		return status;
	}
}

export { Activity };