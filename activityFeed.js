import { YouTubeUserActivity } from "./src/YouTubeUserActivity.js";
import { AtomActivity } from "./src/AtomActivity.js";
import { RssActivity } from "./src/RssActivity.js";
import { TwitterUserActivity } from "./src/TwitterUserActivity.js";
import pluginRss from "@11ty/eleventy-plugin-rss";


class ActivityFeed {
	constructor() {
		this.sources = [];
	}

	setCacheDuration(duration) {
		this.cacheDuration = duration;
	}

	addSource(type, label, ...args) {
		let cls;
		if(type === "twitterUser") {
			cls = TwitterUserActivity;
		} else if(type === "youtubeUser") {
			cls = YouTubeUserActivity;
		} else if(type === "atom") {
			cls = AtomActivity;
		} else if(type === "rss") {
			cls = RssActivity;
		} else {
			throw new Error(`${type} is not a supported activity type for addSource`);
		}

		let source = new cls(...args);
		source.setLabel(label);
		if(this.cacheDuration) {
			source.setCacheDuration(this.cacheDuration);
		}

		this.sources.push(source);
	}

	async getEntries() {
		let entries = [];
		for(let source of this.sources) {
			entries = [
				...entries,
				...await source.getEntries(),
			]
		}

		return entries.sort((a, b) => {
			if(a.published < b.published) {
				return 1;
			}
			if(a.published > b.published) {
				return -1;
			}
			return 0;
		});
	}

	async toRssFeed(metadata) {
		let entries = await this.getEntries();
		let url = metadata.url?.home || metadata.url;
		let feedUrl = metadata.url?.feed || url;

		return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xml:base="${url}" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${metadata.title}</title>
		<link>${url}</link>
		<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
		<description>${metadata.subtitle}</description>
		<language>${metadata.language}</language>
		${entries.map(entry => {
			return `
		<item>
			<title>${entry.title}</title>
			<link>${entry.url}</link>
			<description><![CDATA[${entry.content || ""}]]></description>
			<pubDate>${pluginRss.dateToRfc822(new Date(Date.parse(entry.published)))}</pubDate>
			<dc:creator>${entry.author.name}</dc:creator>
			<guid>${entry.url}</guid>
		</item>`;
		}).join("\n")}
	</channel>
</rss>`
	}
}

export {ActivityFeed};