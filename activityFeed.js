import pluginRss from "@11ty/eleventy-plugin-rss";
import TurndownService from "turndown";

import { YouTubeUserActivity } from "./src/Activity/YouTubeUser.js";
import { AtomActivity } from "./src/Activity/Atom.js";
import { RssActivity } from "./src/Activity/Rss.js";
import { WordPressApiActivity } from "./src/Activity/WordPressApi.js";

const WORDPRESS_TO_PRISM_LANGUAGE_TRANSLATION = {
	jscript: "js"
};

const turndownService = new TurndownService({
	headingStyle: "atx",
	bulletListMarker: "-",
	codeBlockStyle: "fenced",
	// preformattedCode: true,
});

turndownService.addRule("pre-without-code-to-fenced-codeblock", {
	filter: ["pre"],
	replacement: function(content, node, options) {
		let brush = (node.getAttribute('class') || "").split(";").filter(entry => entry.startsWith("brush:"))
		let language = (brush[0] || ":").split(":")[1].trim();

		return `\`\`\`${WORDPRESS_TO_PRISM_LANGUAGE_TRANSLATION[language] || language}
${content}
\`\`\``;
	}
});

class ActivityFeed {
	constructor() {
		this.sources = [];
	}

	setCacheDuration(duration) {
		this.cacheDuration = duration;
	}

	addSource(type, label, ...args) {
		let cls;
		if(type === "youtubeUser") {
			cls = YouTubeUserActivity;
		} else if(type === "atom") {
			cls = AtomActivity;
		} else if(type === "rss") {
			cls = RssActivity;
		} else if(type === "wordpressapi") {
			cls = WordPressApiActivity;
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

	static convertHtmlToMarkdown(html) {
		return turndownService.turndown(html);
	}

	async getEntries(options = {}) {
		let entries = [];
		for(let source of this.sources) {
			entries = [
				...entries,
				...await source.getEntries(),
			]
		}

		entries = entries.map(entry => {
			entry.published = new Date(Date.parse(entry.published));

			if(options.contentType === "markdown" || options.contentType === "md") {
				entry.content = turndownService.turndown(entry.content);
			}

			return entry;
		});

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
			<title>${entry.label}: ${entry.title}</title>
			<link>${entry.url}</link>
			<description><![CDATA[${entry.content || ""}]]></description>
			<pubDate>${pluginRss.dateToRfc822(entry.published)}</pubDate>
${entry.authors.map(author => `			<dc:creator>${author.name}</dc:creator>\n`)}
			<guid>${entry.url}</guid>
		</item>`;
		}).join("\n")}
	</channel>
</rss>`
	}
}

export {ActivityFeed};
