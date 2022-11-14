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
		if(Array.isArray(data.rss.channel.item)) {
			return data.rss.channel.item;
		}
		return [data.rss.channel.item];
	}

	cleanEntry(entry, data) {
		return {
			type: "rss",
			title: entry.title,
			url: entry.link,
			author: {
				name: data.rss.channel.title,
				url: data.rss.channel.link,
			},
			published: (new Date(Date.parse(entry.pubDate))).toISOString(),
			// updated: entry.updated,
			content: entry.description,
		}
	}
}

export {RssActivity};