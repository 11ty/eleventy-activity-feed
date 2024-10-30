import path from "node:path";
import { ActivityFeed } from "./activityFeed.js";

let feed = new ActivityFeed();

feed.setCacheDuration("4h");

// YouTube
feed.addSource("youtubeUser", "UCskGTioqrMBcw8pd14_334A");

// Blog
feed.addSource("atom", "https://www.11ty.dev/blog/feed.xml");

// GitHub Releases
feed.addSource("atom",{
	url: "https://github.com/11ty/eleventy/releases.atom",
	filepathFormat: (url) => `/11ty/releases/${url.split("/").pop()}.md`,
});

// Social RSS feeds (limited historical content)
feed.addSource("fediverse", "zachleat@fediverse.zachleat.com");
feed.addSource("fediverse", "eleventy@fosstodon.org");

feed.addSource("rss", "https://fosstodon.org/users/eleventy.rss");

feed.addSource("bluesky", "zachleat.com");
feed.addSource("bluesky", "11ty.dev");

// WordPress blogs
feed.addSource("wordpressApi", "https://blog.fontawesome.com/");

// feed.addSource("rss", "https://baseline2024.wordpress.com/feed/");
feed.addSource("wordpressApi", "https://baseline2024.wordpress.com/");

let entries = await feed.getEntries({
	contentType: "markdown"
});

let { counts } = feed.toFiles(entries, {
	dryRun: true,
	contentType: "markdown"
});
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