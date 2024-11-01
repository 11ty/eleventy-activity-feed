import path from "node:path";
import { createHash } from "node:crypto";
import pluginRss from "@11ty/eleventy-plugin-rss";
import TurndownService from "turndown";
import fs from "graceful-fs";
import yaml from "js-yaml";
import kleur from "kleur";
import {filesize} from "filesize";

import { YouTubeUserActivity } from "./src/Activity/YouTubeUser.js";
import { AtomActivity } from "./src/Activity/Atom.js";
import { RssActivity } from "./src/Activity/Rss.js";
import { WordPressApiActivity } from "./src/Activity/WordPressApi.js";
import { BlueskyUserActivity } from "./src/Activity/BlueskyUser.js";
import { FediverseUserActivity } from "./src/Activity/FediverseUserActivity.js";

const HASH_FILENAME_MAXLENGTH = 12;

const WORDPRESS_TO_PRISM_LANGUAGE_TRANSLATION = {
	jscript: "js"
};

class ActivityFeed {
	#draftsFolder = "drafts";
	#outputFolder = ".";
	#cacheDuration = "0s";
	#turndownService = null;

	constructor() {
		this.sources = [];
	}

	setDraftsFolder(dir) {
		this.#draftsFolder = dir;
	}

	setOutputFolder(dir) {
		this.#outputFolder = dir;
	}

	setCacheDuration(duration) {
		this.#cacheDuration = duration;
	}


	get turndownService() {
		if(!this.#turndownService) {
			this.#turndownService = new TurndownService({
				headingStyle: "atx",
				bulletListMarker: "-",
				codeBlockStyle: "fenced",
				// preformattedCode: true,
			});

			this.#turndownService.addRule("pre-without-code-to-fenced-codeblock", {
				filter: ["pre"],
				replacement: function(content, node) {
					let brush = (node.getAttribute("class") || "").split(";").filter(entry => entry.startsWith("brush:"))
					let language = (brush[0] || ":").split(":")[1].trim();

					return `\`\`\`${WORDPRESS_TO_PRISM_LANGUAGE_TRANSLATION[language] || language}
			${content}
			\`\`\``;
				}
			});
		}

		return this.#turndownService;
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
		let cacheDuration = this.#cacheDuration;
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

	convertHtmlToMarkdown(html) {
		return this.turndownService.turndown(html);
	}

	async getEntries(options = {}) {
		let entries = [];
		for(let source of this.sources) {
			for(let entry of await source.getEntries()) {
				entries.push(entry);
			}
		}

		return entries.map(entry => {
			if(options.contentType === "markdown") {
				entry.content = this.convertHtmlToMarkdown(entry.content);
			}

			if(options.contentType) {
				entry.contentType = options.contentType;
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

	getFilePath(entry) {
		let { url } = entry;

		let source = entry.source;

		// prefer addSource specific override, then fallback to ActivityType default
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
			return path.join(this.#outputFolder, pathname);
		}

		// WordPress drafts only have a UUID query param e.g. ?p=ID_NUMBER
		if(fallbackPath === "/") {
			fallbackPath = createHash("sha256").update(entry.url).digest("base64").replace(/[^A-Z0-9]/gi, "").slice(0, HASH_FILENAME_MAXLENGTH);
		}

		let subdirs = [];
		if(this.#outputFolder) {
			subdirs.push(this.#outputFolder);
		}
		if(this.#draftsFolder && entry.status === "draft") {
			subdirs.push(this.#draftsFolder);
		}

		let pathname = path.join(".", ...subdirs, path.normalize(fallbackPath));
		let extension = entry.contentType === "markdown" ? ".md" : ".html";

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
			let frontMatterData = Object.assign({}, entry);

			if(entry.status === "draft") {
				// Don’t write to file system in Eleventy
				frontMatterData.permalink = false;
				frontMatterData.draft = true;
			}

			// https://www.npmjs.com/package/js-yaml#dump-object---options-
			let frontMatter = yaml.dump(frontMatterData, {
				// sortKeys: true,
				noCompatMode: true,
				replacer: function(key, value) {
					// ignore these keys in front matter
					if(key === "content" || key === "contentType" || key === "dateUpdated") {
						return;
					}

					return value;
				}
			});

			let content = `---
${frontMatter}---
${entry.content}`

			let pathname = this.getFilePath(entry);
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

			console.log(kleur.gray("Importing"), entry.url, kleur.gray("to"), pathname, kleur.gray(`(${filesize(content.length, {
				spacer: ""
			})}${options.dryRun ? ", dry run" : ""})`));
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
