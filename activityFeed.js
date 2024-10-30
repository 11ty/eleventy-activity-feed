import path from "node:path";
import pluginRss from "@11ty/eleventy-plugin-rss";
import TurndownService from "turndown";
import fs from "graceful-fs";
import yaml from "js-yaml";
import kleur from 'kleur';

import { YouTubeUserActivity } from "./src/Activity/YouTubeUser.js";
import { AtomActivity } from "./src/Activity/Atom.js";
import { RssActivity } from "./src/Activity/Rss.js";
import { WordPressApiActivity } from "./src/Activity/WordPressApi.js";
import { HostedWordPressApiActivity } from "./src/Activity/HostedWordPressApi.js";
import { BlueskyUserActivity } from "./src/Activity/BlueskyUser.js";
import { FediverseUserActivity } from "./src/Activity/FediverseUserActivity.js";

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

	addSource(type, options = {}) {
		type = type?.toLowerCase();

		let cls;
		if(type === "youtubeuser") {
			cls = YouTubeUserActivity;
		} else if(type === "atom") {
			cls = AtomActivity;
		} else if(type === "rss") {
			cls = RssActivity;
		} else if(type === "wordpressapi") {
			cls = WordPressApiActivity;
		} else if(type === "bluesky") {
			cls = BlueskyUserActivity; // RSS
		} else if(type === "fediverse") {
			cls = FediverseUserActivity; // RSS
		} else {
			throw new Error(`${type} is not a supported activity type for addSource`);
		}

		let identifier;
		let label;
		let cacheDuration = this.cacheDuration;
		let filepathFormat;

		if(typeof options === "string") {
			identifier = options;
		} else {
			identifier = options.url || options.id;
			label = options.label;
			cacheDuration = options.cacheDuration;
			filepathFormat = options.filepathFormat;
		}

		let source = new cls(identifier);

		if(label) {
			source.setLabel(label);
		}

		if(cacheDuration) {
			source.setCacheDuration(cacheDuration);
		}

		if(filepathFormat) {
			source.setFilepathFormatFunction(filepathFormat);
		}

		this.sources.push(source);
	}

	static convertHtmlToMarkdown(html) {
		return turndownService.turndown(html);
	}

	async getEntries(options = {}) {
		let entries = [];
		for(let source of this.sources) {
			for(let entry of await source.getEntries()) {
				entries.push(entry);
			}
		}

		return entries.map(entry => {
			if(options.contentType === "markdown" || options.contentType === "md") {
				entry.content = turndownService.turndown(entry.content);
			}

			return entry;
		}).sort((a, b) => {
			if(a.date < b.date) {
				return 1;
			}
			if(a.date > b.date) {
				return -1;
			}
			return 0;
		});
	}

	getDirectory(pathname) {
		let dirs = pathname.split("/");
		dirs.pop();
		return dirs.join("/");
	}

	getFilePath(entry, options = {}) {
		let { url } = entry;

		let source = entry.source;
		// prefer addSource override, then fallback to type default
		let fallbackPath;
		let hasFilePathFallback = typeof source?.constructor?.getFilePath === "function";
		if(hasFilePathFallback) {
			fallbackPath = source?.constructor?.getFilePath(url);
		} else {
			fallbackPath = (new URL(url)).pathname;
		}

		let outputOverrideFn = source?.getFilepathFormatFunction();
		if(outputOverrideFn && typeof outputOverrideFn === "function") { // entry override
			let pathname = outputOverrideFn(url, fallbackPath);
			if(pathname === false) {
				return false;
			}

			// does *not* add a file extension for you
			return path.join(".", pathname);
		}

		let subdir = source?.constructor?.INCLUDE_TYPE_IN_PATH ? source?.constructor?.TYPE : "";
		let pathname = path.join(".", subdir, path.normalize(fallbackPath));

		let extension = options.contentType === "markdown" || options.contentType === "md" ? ".md" : ".html";

		if(pathname.endsWith("/")) {
			return `${pathname.slice(0, -1)}${extension}`;
		}

		return `${pathname}${extension}`;
	}

	// TODO options.pathPrefix
	toFiles(entries = [], options = {}) {
		let dirsCreated = {};
		let filepathConflicts = {};
		let filesWrittenCount = 0;

		for(let entry of entries) {
			// https://www.npmjs.com/package/js-yaml#dump-object---options-
			let frontMatter = yaml.dump(entry, {
				// sortKeys: true,
				noCompatMode: true,
				replacer: function(key, value) {
					if(key === "content" || key === "dateUpdated") {
						return;
					}
					return value;
				}
			});

			let content = `---
${frontMatter}---
${entry.content}`

			let pathname = this.getFilePath(entry, options);
			if(pathname === false) {
				continue;
			}
			if(filepathConflicts[pathname]) {
				throw new Error(`Multiple entries attempted to write to the same place: ${pathname} (originally via ${filepathConflicts[pathname]})`);
			}
			filepathConflicts[pathname] = entry.url || true;

			let dir = this.getDirectory(pathname);
			if(dir && !dirsCreated[dir]) {
				if(!options.dryRun) {
					fs.mkdirSync(dir, { recursive: true })
				}

				dirsCreated[dir] = true;
			}

			console.log(kleur.gray("Importing"), entry.url, kleur.gray("to"), pathname, options.dryRun ? kleur.gray("(dry run)") : "");
			if(!options.dryRun) {
				fs.writeFileSync(pathname, content, { recursive: true, encoding: "utf8" });
			}
			filesWrittenCount++;
		}

		return {
			counts: {
				files: filesWrittenCount,
				directories: Object.keys(dirsCreated).length,
			}
		};
	}

	async toRssFeed(entries, metadata = {}) {
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
			<pubDate>${pluginRss.dateToRfc822(entry.date)}</pubDate>
${entry.authors.map(author => `			<dc:creator>${author.name}</dc:creator>\n`)}
			<guid>${entry.url}</guid>
		</item>`;
		}).join("\n")}
	</channel>
</rss>`
	}
}

export {ActivityFeed};
