# eleventy-activity-feed

Activity Feed lets you build one centralized RSS feed that pulls in new entries from a bunch of different social networking sites. Support for (one or more) YouTube, RSS or Atom for existing blogs, and Bluesky or Mastodon (via RSS). Contributions for more are welcome [in the `@11ty/import` package](https://github.com/11ty/eleventy-import)!

This allows you to encourage folks to subscribe in *one* location and you can control how that feed is populated later.

**Limitations:**

- This is not a permanent data store or archival tool for your content. This is merely a aggregation and rebroadcast tool for your new content in RSS. [Use `@11ty/import` for the archival use case](https://github.com/11ty/eleventy-import)!

**Caching Notes**:

- When used in a static build, this will only update the feed when your build runs. I’d recommend setting up a recurring build to generate your feed regularly (maybe daily?).
- You can persist your fetch cache across builds—learn more on the [Eleventy Fetch docs](https://www.11ty.dev/docs/plugins/fetch/#running-this-on-your-build-server). Vercel and Cloudflare Pages offer this functionality for-free.
	- You can control the maximum frequency at which new fetches are made to the APIs using `feed.setCacheDuration("4h");`

## Demo

You can subscribe to the following Eleventy feed in your RSS reader of choice to see it in action:

https://www.11ty.dev/follow/

## Installation

```
npm install @11ty/eleventy-activity-feed
```

<!-- // npm packages published
// github releases and activity
// todo historical duration -->

### Sample Eleventy Template

* Use `follow-feed.11ty.cjs` in an ESM project (if `"type": "module"` in your `package.json`)
* Use `follow-feed.11ty.js` in a CommonJS project

```js
export default class {
	data() {
		return {
			// Controls where the file is written
			permalink: "/follow.rss"
		}
	}

	async render() {
		const { ActivityFeed } = await import("@11ty/eleventy-activity-feed");

		let feed = new ActivityFeed();

		feed.setCacheDuration("4h");

		// YouTube
		feed.addSource("youtubeUser", "YouTube", "UCskGTioqrMBcw8pd14_334A");

		// Blog
		feed.addSource("atom", "Blog", "https://www.11ty.dev/blog/feed.xml");

		// Mastodon
		feed.addSource("rss", "Mastodon", "https://fosstodon.org/users/eleventy.rss");

		return feed.toRssFeed({
			title: "Eleventy’s Activity Feed",
			language: "en",
			url: "https://www.11ty.dev/follow/",
			subtitle: "One centralized feed of Eleventy activity across the web.",
		});
	}
};
```

Add to the `<head>` of your page to show it in RSS readers:

```html
<link rel="alternate" href="/follow.rss" title="Eleventy’s Activity Feed" type="application/rss+xml">
```
