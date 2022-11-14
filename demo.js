import { ActivityFeed } from "./activityFeed.js";

let feed = new ActivityFeed();

feed.setCacheDuration("4h");

feed.addSource("youtubeUser", "YouTube", "UCskGTioqrMBcw8pd14_334A"); // Eleventy
feed.addSource("youtubeUser", "YouTube", "UCMlSs0Ltg57qpYdFwUVLR2A"); // zachleat

feed.addSource("atom", "Blog","https://www.zachleat.com/web/feed/");
feed.addSource("atom", "Blog", "https://www.11ty.dev/blog/feed.xml");

feed.addSource("rss", "Mastodon", "https://fediverse.zachleat.com/users/zachleat.rss");
feed.addSource("rss", "Mastodon", "https://fosstodon.org/users/eleventy.rss");

feed.addSource("twitterUser", "Twitter", "zachleat", "96383");
feed.addSource("twitterUser", "Twitter", "eleven_ty", "949639269433380864");

let content = await feed.toRssFeed({
	title: "Zach’s Activity Feedbag",
	language: "en",
	url: "https://www.zachleat.com/feed/activity/",
	subtitle: "A feed of all of Zach’s socials in one.",
});

console.log( content );