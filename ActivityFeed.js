import { Importer } from "@11ty/import";
import pluginRss from "@11ty/eleventy-plugin-rss";

class ActivityFeed {
	#importer;

	get importer() {
		if(!this.#importer) {
			this.#importer = new Importer();
			this.#importer.setDryRun(true);
			this.#importer.setAssetReferenceType("disabled");
			// TODO make this an option
			this.#importer.setVerbose(false); // --quiet
		}

		return this.#importer;
	}

	setCacheDuration(duration) {
		this.importer.setCacheDuration(duration);
	}

	addSource(type, label, identifier) {
		this.importer.addSource(type, {
			url: identifier,
			label,
		});
	}

	async getEntries() {
		return this.importer.getEntries({
			contentType: "html",
		});
	}

	async toRssFeed(metadata = {}) {
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
			<title>${entry.sourceLabel}: ${entry.title}</title>
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
