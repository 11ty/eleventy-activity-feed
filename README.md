# eleventy-activity-feed

## Installation

```
npm install @11ty/eleventy-activity-feed
```

Twitter User activity requires a `TWITTER_BEARER_TOKEN` environment variable (you can put this in a `.env` file).

<!-- // npm packages published
// github releases and activity -->

## Sample Usage

This is an `.11ty.cjs` Eleventy JavaScript template (e.g. `activity.11ty.cjs`):

```js
module.exports = class {
	data() {
		return {
			permalink: "activity.rss"
		}
	}

	async render() {
		const { ActivityFeed } = await import("@11ty/eleventy-activity-feed");

		let feed = new ActivityFeed();

		feed.setCacheDuration("4h");

		// The Eleventy Activity Feed
		feed.addSource("youtubeUser", "YouTube", "UCskGTioqrMBcw8pd14_334A"); // Eleventy
		feed.addSource("atom", "Blog", "https://www.11ty.dev/blog/feed.xml");
		feed.addSource("rss", "Mastodon", "https://fosstodon.org/users/eleventy.rss");
		feed.addSource("twitterUser", "Twitter", "eleven_ty", "949639269433380864");

		return feed.toRssFeed({
			title: "Eleventy’s Activity Feed",
			language: "en",
			url: "https://www.11ty.dev/activity/",
			subtitle: "One centralized feed of Eleventy activity across the web.",
		});
	}
};
```