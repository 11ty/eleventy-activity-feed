import { ActivityFeed } from "./activityFeed.js";

let feed = new ActivityFeed();

feed.setCacheDuration("4h");

// YouTube
feed.addSource("youtubeUser", "YouTube", "UCskGTioqrMBcw8pd14_334A");

// Blog
feed.addSource("atom", "Blog", "https://www.11ty.dev/blog/feed.xml");

// GitHub Releases
feed.addSource("atom", "Releases", "https://github.com/11ty/eleventy/releases.atom");

// Mastodon
// feed.addSource("rss", "Mastodon", "https://fediverse.zachleat.com/users/zachleat.rss");
// feed.addSource("rss", "Bluesky", "https://bsky.app/profile/zachleat.com/rss");
feed.addSource("rss", "Mastodon", "https://fosstodon.org/users/eleventy.rss");
feed.addSource("rss", "Bluesky", "https://bsky.app/profile/11ty.dev/rss");

// feed.addSource("rss", "WordPress", "https://baseline2024.wordpress.com/feed/");

feed.addSource("wordpressapi", "WordPress", "https://blog.fontawesome.com/");

// let content = await feed.toRssFeed({
// 	title: "Eleventy’s Activity Feed",
// 	language: "en",
// 	url: "https://www.11ty.dev/follow/",
// 	subtitle: "One centralized feed of Eleventy activity across the web.",
// });
// console.log( content );

let content = await feed.getEntries({
	contentType: "markdown"
});

