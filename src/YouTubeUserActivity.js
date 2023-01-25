import { Activity } from "./Activity.js";

class YouTubeUserActivity extends Activity {
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

	cleanEntry(entry) {
		return {
			type: "youtube",
			title: entry.title,
			url: `https://www.youtube.com/watch?v=${entry['yt:videoId']}`,
			author: {
				name: entry.author.name,
				url: entry.author.uri,
			},
			published: entry.published,
			updated: entry.updated,
			// TODO linkify, nl2br
			content: entry['media:group']['media:description'],
		}
	}
}

export {YouTubeUserActivity};