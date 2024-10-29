import { Activity } from "../Activity.js";

class YouTubeUserActivity extends Activity {
	static TYPE = "youtube";

	constructor(channelId) {
		super();
		this.id = channelId;
	}

	getType() {
		return "xml";
	}

	getUrl() {
		return `https://www.youtube.com/feeds/videos.xml?channel_id=${this.id}`
	}

	getEntriesFromData(data) {
		return data.feed?.entry || [];
	}

	getUniqueIdFromEntry(entry) {
		return `${Activity.UUID_PREFIX}::${YouTubeUserActivity.TYPE}::${entry['yt:videoId']}`;
	}

	cleanEntry(entry) {
		return {
			uuid: this.getUniqueIdFromEntry(entry),
			type: YouTubeUserActivity.TYPE,
			via: this.label,
			title: entry.title,
			url: `https://www.youtube.com/watch?v=${entry['yt:videoId']}`,
			authors: [
				{
					name: entry.author.name,
					url: entry.author.uri,
				}
			],
			date: entry.published,
			dateUpdated: entry.updated,
			// TODO linkify, nl2br
			content: entry['media:group']['media:description'],
		}
	}
}

export {YouTubeUserActivity};