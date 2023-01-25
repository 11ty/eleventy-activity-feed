import { Activity } from "./Activity.js";

class RssActivity extends Activity {
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
		if(Array.isArray(data.rss?.channel?.item)) {
			return data.rss.channel.item;
		}

		if(data.rss?.channel?.item) {
			return [data.rss.channel.item];
		}

		return [];
	}

	cleanEntry(entry, data) {
		return {
			type: "rss",
			title: entry.title || this.toReadableDate(entry.pubDate),
			url: entry.link,
			author: {
				name: data.rss.channel.title,
				url: data.rss.channel.link,
			},
			published: this.toIsoDate(entry.pubDate),
			// updated: entry.updated,
			content: entry.description,
		}
	}
}

export {RssActivity};