import { ActivityFeed } from "./activityFeed.js";

let feed = new ActivityFeed();

feed.setCacheDuration("4h");

// YouTube
// feed.addSource("youtubeUser", "YouTube", "UCskGTioqrMBcw8pd14_334A");

// Blog
// feed.addSource("atom", "11ty Blog", "https://www.11ty.dev/blog/feed.xml");

// GitHub Releases
// feed.addSource("atom", "GitHub Releases", "https://github.com/11ty/eleventy/releases.atom");

// Social RSS feeds
// feed.addSource("rss", "Mastodon", "https://fediverse.zachleat.com/users/zachleat.rss");
feed.addSource("rss", "Bluesky", "https://bsky.app/profile/zachleat.com/rss");
// feed.addSource("rss", "Mastodon", "https://fosstodon.org/users/eleventy.rss");
// feed.addSource("rss", "Bluesky", "https://bsky.app/profile/11ty.dev/rss");
// feed.addSource("rss", "WordPress", "https://baseline2024.wordpress.com/feed/");

// feed.addSource("wordpressapi", "WordPress", "https://blog.fontawesome.com/");
feed.addSource("wordpressapi-hosted", "WordPress", "https://baseline2024.wordpress.com/");

let entries = await feed.getEntries({
	contentType: "markdown"
});

let { counts } = feed.toFiles(entries);
console.log( `Directories: ${counts.directories}` );
console.log( `Files: ${counts.files}` );

// let feedContent = await feed.toRssFeed(entries, {
// 	title: "Eleventy’s Activity Feed",
// 	language: "en",
// 	url: "https://www.11ty.dev/follow/",
// 	subtitle: "One centralized feed of Eleventy activity across the web.",
// });

// console.log( "Last entry:", entries[entries.length - 1] );
// console.log( entries.length, "Results Found" );