import { Activity } from "../Activity.js";

class WordPressApiActivity extends Activity {
	static TYPE = "wordpressapi";

	constructor(url) {
		super();
		this.url = url;
	}

	getType() {
		return "json";
	}

	#getAuthorUrl(id) {
		return (new URL(`/wp-json/wp/v2/users/${id}`, this.url)).toString();
	}

	getUrl() {
		// return function for paging
		return (pageNumber = 1) => {
			return (new URL(`/wp-json/wp/v2/posts/?page=${pageNumber}&per_page=100`, this.url)).toString();
		};
	}

	getEntriesFromData(data) {
		if(Array.isArray(data)) {
			return data;
		}

		return [];
	}

	getUrlFromEntry(entry) {
		return entry.link;
	}

	getUniqueIdFromEntry(entry) {
		return `${Activity.UUID_PREFIX}::${WordPressApiActivity.TYPE}::${entry.guid.rendered}`;
	}

	async getAuthorData(authorId) {
		return this.getData(this.#getAuthorUrl(authorId), this.getType());
	}

	async cleanEntry(entry, data) {
		// Warning: extra API call
		let authorData = await this.getAuthorData(entry.author);

		return {
			type: WordPressApiActivity.TYPE,
			via: this.label,
			id: this.getUniqueIdFromEntry(entry),
			title: entry.title?.rendered,
			url: this.getUrlFromEntry(entry),
			authors: [
				{
					// _wordpress_author_id: entry.author,
					name: authorData.name,
					url: authorData.url || authorData.link,
					avatarUrl: authorData.avatar_urls[Object.keys(authorData.avatar_urls).pop()],
				}
			],
			published: entry.date_gmt,
			updated: entry.modified_gmt,
			content: entry.content.rendered,
		}
	}
}

export { WordPressApiActivity };