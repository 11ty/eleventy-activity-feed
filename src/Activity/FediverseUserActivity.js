import path from "node:path";
import { Activity } from "../Activity.js";

class FediverseUserActivity extends Activity {
	static TYPE = "fediverse";

	constructor(fullUsername) {
		super();

		let { username, hostname } = FediverseUserActivity.parseUsername(fullUsername);

		this.username = username;
		this.hostname = hostname;
	}

	static parseUsername(fullUsername) {
		if(fullUsername.startsWith("@")) {
			fullUsername = fullUsername.slice(1);
		}

		let [ username, hostname ]= fullUsername.split("@");

		return {
			username,
			hostname
		}
	}

	static parseFromUrl(url) {
		let { hostname, pathname } = new URL(url);
		let [empty, username, postId] = pathname.split("/");

		return {
			username: username.startsWith("@") ? username.slice(1) : username,
			hostname,
			postId,
		}
	}

	getType() {
		return "xml";
	}

	getUrl() {
		return `https://${this.hostname}/users/${this.username}.rss`
	}

	getEntriesFromData(data) {
		if(Array.isArray(data.rss?.channel?.item)) {
			return data.rss.channel.item;
		}

		if(data.rss?.channel?.item) {
			return [data.rss.channel.item];
		}

		return [];
	}

	getUniqueIdFromEntry(entry) {
		return `${Activity.UUID_PREFIX}::${FediverseUserActivity.TYPE}::${entry.link}`;
	}

	static getFilePath(url) {
		let { hostname, username, postId } = FediverseUserActivity.parseFromUrl(url);
		return path.join(`${username}@${hostname}`, postId);
	}

	cleanEntry(entry, data) {
		return {
			uuid: this.getUniqueIdFromEntry(entry),
			type: FediverseUserActivity.TYPE,
			title: this.toReadableDate(entry.pubDate),
			url: entry.link,
			authors: [
				{
					name: data.rss.channel.title,
					url: data.rss.channel.link,
				}
			],
			date: this.toIsoDate(entry.pubDate),
			// TODO linkify, nl2br
			content: entry.description,
		}
	}
}

export { FediverseUserActivity };