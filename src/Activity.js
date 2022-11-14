import EleventyFetch from "@11ty/eleventy-fetch";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser();

class Activity {
	setLabel(label) {
		this.label = label;
	}

	setCacheDuration(duration) {
		this.cacheDuration = duration;
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

	async getData(url, type) {
		let result = EleventyFetch(url, {
			duration: this.cacheDuration || "0s",
			type: type === "json" ? type : "text",
			fetchOptions: {
				headers: Object.assign({
					"user-agent": "Eleventy Activity Hub v1.0.0",
				}, this.getHeaders()),
			}
		});

		if(type === "xml") {
			return xmlParser.parse(await result);
		}

		return result;
	}

	async getEntries() {
		let data = await this.getData(this.getUrl(), this.getType());
		let entries = this.getEntriesFromData(data).map(entry => {
			let ret = this.cleanEntry(entry, data);
			if(this.label) {
				ret.title = `${this.label}: ${ret.title}`;
			}
			return ret;
		});
		return entries;
	}
}

export { Activity };