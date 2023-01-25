import { Activity } from "./Activity.js";

class AtomActivity extends Activity {
	constructor(url) {
		super();
		this.url = url;
	}

	getType() {
		return "xml";
	}

	getUrl() {
		return this.url;
	}

	getEntriesFromData(data) {
		if(Array.isArray(data.feed?.entry)) {
			return data.feed.entry;
		}

		if(data.feed?.entry) {
			return [data.feed.entry];
		}

		return [];
	}

	getUrlFromEntry(entry) {
		if(this.isValidHttpUrl(entry.id)) {
			return entry.id;
		}
		if(entry.link && entry.link["@_rel"] === "alternate" && entry.link["@_href"] && this.isValidHttpUrl(entry.link["@_href"])) {
			return entry.link["@_href"];
		}
		return entry.id;
	}

	cleanEntry(entry, data) {
		return {
			type: "atom",
			title: entry.title,
			url: this.getUrlFromEntry(entry),
			author: {
				name: entry?.author?.name || data.feed?.author?.name,
			},
			published: entry.published || entry.updated,
			updated: entry.updated,
		}
	}
}

export {AtomActivity};