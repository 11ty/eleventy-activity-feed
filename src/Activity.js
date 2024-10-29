import EleventyFetch from "@11ty/eleventy-fetch";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
	attributeNamePrefix : "@_",
	ignoreAttributes: false,
	allowBooleanAttributes: true,
	parseAttributeValue: true,
});

class Activity {
	static UUID_PREFIX = "11tyaf";

	static log(...messages) {
		console.log(...messages)
	}

	setLabel(label) {
		this.label = label;
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

	setCacheDuration(duration) {
		this.cacheDuration = duration;
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

	getUniqueIdFromEntry(entry) {
		return "";
	}

	// Thanks to https://stackoverflow.com/questions/7467840/nl2br-equivalent-in-javascript/7467863#7467863
	static nl2br(str) {
		if (typeof str === 'undefined' || str === null) {
			return "";
		}
		return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
	}

	async getData(url, type) {
		let result = EleventyFetch(url, {
			duration: this.cacheDuration || "0s",
			type: type === "json" ? type : "text",
			fetchOptions: {
				headers: Object.assign({
					"user-agent": "Eleventy Activity Feed v1.0.0",
				}, this.getHeaders()),
			}
		});

		if(type === "xml") {
			return xmlParser.parse(await result);
		}

		return result;
	}

	async #getCleanedEntries(url) {
		let entries = [];
		let data = await this.getData(url, this.getType());
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
					Activity.log( `Fetching page ${pageNumber}: ${pagedUrl}` );
					let found = 0;
					for(let entry of await this.#getCleanedEntries(pagedUrl)) {
						entries.push(entry);
						found++;
					}
					if(found === 0) {
						break;
					}

					pageNumber++;
				}
			} catch(e) {
				if(e.cause instanceof Response) {
					let errorData = await e.cause.json();
					if(errorData?.code === "rest_post_invalid_page_number") {
						// Last page, do nothing.
					} else {
						Activity.log("Error: " + e.message)
					}
				} else {
					Activity.log("Error: " + e.message)
				}
			}
		} else if(typeof url === "string" || url instanceof URL) {
			for(let entry of await this.#getCleanedEntries(url) || []) {
				entries.push(entry);
			}
		}
		return entries;
	}

	cleanStatus(status) {
		return {
			"publish": "published"
		}[status];
	}
}

export { Activity };