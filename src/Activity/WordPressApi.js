import { Activity } from "../Activity.js";
import { HostedWordPressApiActivity } from "./HostedWordPressApi.js"

class WordPressApiActivity extends Activity {
	static TYPE = "wordpressapi";

	constructor(url) {
		if(HostedWordPressApiActivity.isValid(url)) {
			return new HostedWordPressApiActivity(url);
		}

		super();
		this.url = url;
	}

	getType() {
		return "json";
	}

	#getSubtypeUrl(subtype, suffix = "") {
		return (new URL(`/wp-json/wp/v2/${subtype}/${suffix}`, this.url)).toString();
	}

	#getAuthorUrl(id) {
		return this.#getSubtypeUrl("users", id);
	}

	#getCategoryUrl(id) {
		return this.#getSubtypeUrl("categories", id);
	}

	#getTagsUrl(id) {
		return this.#getSubtypeUrl("tags", id);
	}

	getUrl() {
		// return function for paging
		return (pageNumber = 1) => {
			return this.#getSubtypeUrl("posts", `?page=${pageNumber}&per_page=100`);
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

	// stock WordPress is single-author
	async #getAuthors(authorId) {
		// Warning: extra API call
		let authorData = await this.getData(this.#getAuthorUrl(authorId), this.getType());

		return [
			{
				// _wordpress_author_id: entry.author,
				name: authorData.name,
				url: authorData.url || authorData.link,
				avatarUrl: authorData.avatar_urls[Object.keys(authorData.avatar_urls).pop()],
			}
		];
	}

	async #getTags(ids) {
		return Promise.all(ids.map(tagId => {
			// Warning: extra API call
			return this.getData(this.#getTagsUrl(tagId), this.getType()).then(tagData => {
				return tagData.name;
			});
		}));
	}

	async #getCategories(ids) {
		return Promise.all(ids.map(categoryId => {
			// Warning: extra API call
			return this.getData(this.#getCategoryUrl(categoryId), this.getType()).then(categoryData => {
				return categoryData.name;
			});
		}));
	}

	// Supports: Title, Aluthor, Published/Updated Dates
	async cleanEntry(entry, data) {
		let obj = {
			uuid: this.getUniqueIdFromEntry(entry),
			type: WordPressApiActivity.TYPE,
			title: entry.title?.rendered,
			url: this.getUrlFromEntry(entry),
			authors: await this.#getAuthors(entry.author),
			date: entry.date_gmt,
			dateUpdated: entry.modified_gmt,
			content: entry.content.rendered,
			status: this.cleanStatus(entry.status),
			metadata: {
				categories: await this.#getCategories(entry.categories),
				tags: await this.#getTags(entry.tags),
				featuredImage: entry.jetpack_featured_media_url,
			},
		};

		if(entry.og_image) {
			obj.metadata.opengraphImage = {
				width: entry.og_image?.width,
				height: entry.og_image?.height,
				src: entry.og_image?.url,
				mime: entry.og_image?.type,
			}
		}

		return obj;
	}
}

export { WordPressApiActivity };