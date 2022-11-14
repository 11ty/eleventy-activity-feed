# eleventy-activity-feed

## Installation

```
npm install @11ty/eleventy-activity-feed
```

Twitter User activity requires a `TWITTER_BEARER_TOKEN` environment variable (you can put this in a `.env` file).

<!-- // npm packages published
// github releases and activity
// todo historical duration -->

## Live Demo

You can subscribe to the following Eleventy feed in your RSS reader of choice to see it in action:

https://www.11ty.dev/follow/

## Sample Usage

This is an `.11ty.cjs` Eleventy JavaScript template (e.g. `follow.11ty.cjs`):

```js
module.exports = class {
	data() {
		return {
			permalink: "follow.rss"
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

		// Twitter
		feed.addSource("twitterUser", "Twitter", "eleven_ty", "949639269433380864");

		return feed.toRssFeed({
			title: "Eleventy’s Activity Feed",
			language: "en",
			url: "https://www.11ty.dev/follow/",
			subtitle: "One centralized feed of Eleventy activity across the web.",
		});
	}
};
```

## What’s Next?

Happy to accept PRs for better HTML display of different feed entries (YouTube needs URL->`<a>` linkified descriptions and Twitter could use @-username links on content) and addition of more types of data! Feel free to contribute!