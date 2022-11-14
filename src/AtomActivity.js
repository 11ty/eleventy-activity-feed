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
		return data.feed.entry;
	}

	cleanEntry(entry, data) {
		return {
			type: "atom",
			title: entry.title,
			url: entry.id,
			author: {
				name: data.feed.author.name,
			},
			published: entry.published || entry.updated,
			updated: entry.updated,
		}
	}
}

export {AtomActivity};