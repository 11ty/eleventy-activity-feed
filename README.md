# eleventy-activity-feed

Activity feed lets you build one centralized RSS feed that pulls in new entries from a bunch of different social networking sites. Support for (one or more) YouTube, RSS or Atom for existing blogs, Mastodon (via RSS), and your Twitter account (contributions for more are welcome!).

This allows you to encourage folks to subscribe in *one* location and you can control how that feed is populated later.

As a completely hypothetical example, if/when Twitter dies in a burning fire and you want to remove that channel from your centralized feed, you can do so and still keep all of your existing subscribers!

_Notable limitation:_ This is not a permanent data store or archival tool for your content. This does _not_ (yet?) fetch old data beyond the initial page of results for each activity type’s API. This is merely a syndication and rebroadcast tool for your new content in RSS.

## Demo

You can subscribe to the following Eleventy feed in your RSS reader of choice to see it in action:

https://www.11ty.dev/follow/

## Installation

```
npm install @11ty/eleventy-activity-feed
```

Twitter User activity requires a `TWITTER_BEARER_TOKEN` environment variable (you can put this in a `.env` file).

<!-- // npm packages published
// github releases and activity
// todo historical duration -->

### Sample Eleventy Usage

This is an `.11ty.cjs` Eleventy JavaScript template (e.g. `follow.11ty.cjs`), most useful in an EcmaScript Modules project (via `"type": "module"` in your `package.json`). Use `.11ty.js` (e.g. `follow.11ty.js`) if your project is using CommonJS.

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