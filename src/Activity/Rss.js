import { Activity } from "../Activity.js";

class RssActivity extends Activity {
	static TYPE = "rss";

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

	getUniqueIdFromEntry(entry) {
		return `${Activity.UUID_PREFIX}::${RssActivity.TYPE}::${entry.guid["#text"]}`;
	}

	cleanEntry(entry, data) {
		return {
			uuid: this.getUniqueIdFromEntry(entry),
			type: RssActivity.TYPE,
			via: this.label,
			title: entry.title || this.toReadableDate(entry.pubDate),
			url: entry.link,
			// TODO support multiple authors, use `dc:creator` https://www.rssboard.org/rss-profile#namespace-elements-dublin-creator
			authors: [
				{
					name: data.rss.channel.title,
					url: data.rss.channel.link,
				}
			],
			published: this.toIsoDate(entry.pubDate),
			// updated: entry.updated,
			content: entry["content:encoded"] || entry.content || entry.description,
		}
	}
}

export {RssActivity};