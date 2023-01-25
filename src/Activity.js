import EleventyFetch from "@11ty/eleventy-fetch";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
	attributeNamePrefix : "@_",
	ignoreAttributes: false,
	allowBooleanAttributes: true,
	parseAttributeValue: true,
});

class Activity {
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
		let dataEntries = this.getEntriesFromData(data) || [];
		let entries = dataEntries.map((entry) => {
			return new Promise(async (resolve) => {
				let ret = await this.cleanEntry(entry, data);
				if(this.label) {
					ret.title = `${this.label}: ${ret.title}`;
				}
				resolve(ret);
			})
		});
		return Promise.all(entries);
	}
}

export { Activity };