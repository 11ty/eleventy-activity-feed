import * as dotenv from 'dotenv';
import { Activity } from "./Activity.js";

dotenv.config();

class TwitterApiUrl {
	constructor(service) {
		this.url = `https://api.twitter.com/2/${service}`;
	}

	setParams(params) {
		this.urlParams = params || {};
	}

	convertParamsToString() {
		let str = [];
		for(let key in this.urlParams) {
			str.push(`${key}=${this.urlParams[key]}`);
		}
		return `?${str.join("&")}`
	}

	getUrl() {
		return `${this.url}${this.convertParamsToString()}`;
	}
} 

class TwitterUserActivity extends Activity {
	constructor(userName, userId, options = {}) {
		super();
		this.userName = userName;
		// TODO automate fetching the userid with an API call to e.g. https://api.twitter.com/2/users/by?usernames=zachleat,eleven_ty&user.fields=created_at,description&expansions=pinned_tweet_id
		this.userId = userId;

		this.options = Object.assign({
			excludeRetweets: true,
			excludeReplies: true,
		}, options);
	}

	getHeaders() {
		return {
			"authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
		}
	}

	getType() {
		return "json";
	}

	getUrl() {
		// https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-tweets
		// App rate limit (Application-only): 1500 requests per 15-minute window shared among all users of your app
		let client = new TwitterApiUrl(`users/${this.userId}/tweets`);

		client.setParams({
			// since_id
			max_results: 100, // results per page
			expansions: [
				"in_reply_to_user_id",
				"attachments.media_keys",
				// "referenced_tweets.id",
				// "referenced_tweets.id.author_id",
				// "entities.mentions.username",
			].join(","),
			"media.fields": [
				"width",
				"height",
				"alt_text",
				"type",
				"preview_image_url",
				"url",
				// "non_public_metrics",
				// "organic_metrics",
				// "promoted_metrics",
			].join(","),
			"tweet.fields": [
				"attachments",
				"author_id",
				// "context_annotations",
				"conversation_id",
				"created_at",
				"entities",
				"id",
				"in_reply_to_user_id",
				"lang",
				"public_metrics",
				// "non_public_metrics",
				// "organic_metrics",
				// "promoted_metrics",
				"possibly_sensitive",
				"referenced_tweets",
				"reply_settings",
				"source",
				"text",
				"withheld"
			].join(",")
		});

		return client.getUrl();
	}

	getEntriesFromData(data) {
		return data.data.filter(entry => {
			if(this.options.excludeReplies && this.isTweetReply(entry)) {
				return false;
			}
			if(this.options.excludeRetweets && this.isTweetRetweet(entry)) {
				return false;
			}
			return true;
		});
	}

	isTweetReply(tweet) {
		return tweet.referenced_tweets?.filter(entry => entry.type === "replied_to").length > 0;
	}

	isTweetRetweet(tweet) {
		return tweet.referenced_tweets?.filter(entry => entry.type === "retweeted").length > 0;
	}

	/* {
      text: 'RT @eleven_ty: 🆕 Eleventy WebC Plugin v0.6.0 🎈🐀⚡️\n' +
        '\n' +
        '🛠 Includes new WebC v0.6.x features and bug fixes https://t.co/Pnl39y04pu\n' +
        '\n' +
        'https://t.co/…',
      id: '1587539505753595904',
      author_id: '96383',
      possibly_sensitive: false,
      public_metrics: [Object],
      reply_settings: 'everyone',
      created_at: '2022-11-01T20:18:07.000Z',
      source: 'Twitter for iPhone',
      entities: [Object],
      lang: 'en',
      conversation_id: '1587539505753595904',
      edit_history_tweet_ids: [Array],
      referenced_tweets: [Array]
    } */
	cleanEntry(entry, data) {
		let obj = {
			type: "tweet",
			title: this.toReadableDate(entry.created_at),
			url: `https://twitter.com/${this.userName}/status/${entry.id}/`,
			author: {
				name: `@${this.userName}`,
				url: `https://twitter.com/${this.userName}/`,
			},
			published: entry.created_at,
			// updated: 
			content: entry.text,
		}

		if(this.isTweetReply(entry)) {
			obj.subtype = "reply";
		} else if(this.isTweetRetweet(entry)) {
			obj.subtype = "retweet";
		}

		return obj;
	}
}

export {TwitterUserActivity};