import path from "node:path";
import { Activity } from "../Activity.js";

class BlueskyUserActivity extends Activity {
	static TYPE = "bluesky";
	static INCLUDE_TYPE_IN_PATH = true;

	constructor(username) {
		super();
		this.username = username;
	}

	getType() {
		return "xml";
	}

	getUrl() {
		return `https://bsky.app/profile/${this.username}/rss`
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
		return `${Activity.UUID_PREFIX}::${BlueskyUserActivity.TYPE}::${entry.link}`;
	}

	static getFilePath(url) {
		let {pathname} = new URL(url);
		let [empty, profile, username, post, id] = pathname.split("/");
		return path.join(username, id);
	}

	cleanEntry(entry, data) {
		return {
			uuid: this.getUniqueIdFromEntry(entry),
			type: BlueskyUserActivity.TYPE,
			title: this.toReadableDate(entry.pubDate),
			url: entry.link,
			authors: [
				{
					name: data.rss.channel.title,
					url: data.rss.channel.link,
				}
			],
			date: this.toIsoDate(entry.pubDate),
			// TODO linkify, nl2br
			content: entry.description,
		}
	}
}

export { BlueskyUserActivity };