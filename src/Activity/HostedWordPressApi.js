import { Activity } from "../Activity.js";

class HostedWordPressApiActivity extends Activity {
	static TYPE = "wordpressapi-hosted";

	constructor(url) {
		super();
		this.url = url;

		let hostname = this.#getHostname(url);
		if(!hostname.endsWith(".wordpress.com")) {
			throw new Error("HostedWordPressApiActivity expects a .wordpress.com URL, if you’re looking to use a self-hosted WordPress API please use the `wordpressapi` type (`WordPressApiActivity` class).");
		}
		this.hostname = hostname;
	}

	#getHostname(url) {
		try {
			let u = new URL(url);
			return u.hostname;
		} catch(e) {}
		return "";
	}

	getType() {
		return "json";
	}

	getUrl() {
		// return function for paging
		return (pageNumber = 1) => {
			return `https://public-api.wordpress.com/rest/v1.1/sites/${this.hostname}/posts/?page=${pageNumber}&per_page=100`;
		};
	}

	getEntriesFromData(data) {
		return data.posts || [];
	}

	getUrlFromEntry(entry) {
		return entry.URL;
	}

	getUniqueIdFromEntry(entry) {
		return `${Activity.UUID_PREFIX}::${HostedWordPressApiActivity.TYPE}::${entry.guid}`;
	}

	// stock WordPress is single-author
	#getAuthorData(author) {
		return [
			{
				name: author.name,
				url: author.profile_URL,
				avatarUrl: author.avatar_URL,
			}
		];
	}

	async cleanEntry(entry, data) {
		return {
			uuid: this.getUniqueIdFromEntry(entry),
			type: HostedWordPressApiActivity.TYPE,
			via: this.label,
			title: entry.title,
			url: this.getUrlFromEntry(entry),
			authors: this.#getAuthorData(entry.author),
			date: entry.date,
			dateUpdated: entry.modified,
			content: entry.content,
			status: this.cleanStatus(entry.status),
			metadata: {
				categories: Object.keys(entry.categories),
				tags: Object.keys(entry.tags),
				featuredImage: entry.featured_image,
				// TODO opengraphImage: { width, height, src, mime }
			},
		}
	}
}

export { HostedWordPressApiActivity };