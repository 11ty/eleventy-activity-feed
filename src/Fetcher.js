import path from "node:path";
import fs from "graceful-fs";
import { createHash } from "node:crypto";
import kleur from "kleur";
import { XMLParser } from "fast-xml-parser";
import {filesize} from "filesize";

import EleventyFetch from "@11ty/eleventy-fetch";
import { Logger } from "./Logger.js";

// 255 total (hash + url + extension)
const HASH_FILENAME_MAXLENGTH = 12;
const MAXIMUM_URL_FILENAME_SIZE = 30;

const xmlParser = new XMLParser({
	attributeNamePrefix : "@_",
	ignoreAttributes: false,
	allowBooleanAttributes: true,
	parseAttributeValue: true,
});

class Fetcher {
	static USER_AGENT = "Eleventy Activity Feed v1.0.0";

	static getFilenameFromSrc(src) {
		let {pathname} = new URL(src);
		let hash = this.createHash(src);

		let filename = pathname.split("/").pop();
		let lastDot = filename.lastIndexOf(".");

		if(lastDot > -1) {
			let filenameWithoutExtension = filename.slice(0, Math.min(lastDot, MAXIMUM_URL_FILENAME_SIZE));
			let extension = filename.slice(lastDot + 1);
			return `${filenameWithoutExtension}-${hash}.${extension}`;
		}

		return `${filename.slice(0, MAXIMUM_URL_FILENAME_SIZE)}-${hash}`;
	}

	static createHash(str) {
		let base64Hash = createHash("sha256").update(str).digest("base64");

		return base64Hash.replace(/[^A-Z0-9]/gi, "").slice(0, HASH_FILENAME_MAXLENGTH);
	}

	#cacheDuration = "0s";
	#directoryManager;

	constructor() {
		this.fetchedUrls = new Set();
		this.writtenImageFiles = new Set();
		this.errors = new Set();
	}

	getCounts() {
		return {
			fetches: this.fetchedUrls.size,
			images: this.writtenImageFiles.size,
			errors: this.errors.size,
		}
	}

	setCacheDuration(duration) {
		this.#cacheDuration = duration;
	}

	setDirectoryManager(manager) {
		this.#directoryManager = manager;
	}

	fetchImage(url, outputFolder, urlPath = "img") {
		let filename = Fetcher.getFilenameFromSrc(url);
		let imageUrlLocation = path.join(urlPath, filename);
		let fullOutputLocation = path.join(outputFolder, imageUrlLocation);

		let promise;
		if(!this.writtenImageFiles.has(fullOutputLocation)) {
			this.writtenImageFiles.add(fullOutputLocation);

			if(this.#directoryManager) {
				this.#directoryManager.createDirectoryForPath(fullOutputLocation);
			}

			// async, but we don’t need to wait
			promise = this.fetch(url, {
				type: "buffer",
			}).then(result => {
				if(result) {
					let size = filesize(result.length, {
						spacer: ""
					});
					Logger.log(kleur.gray("Importing image"), fullOutputLocation, kleur.gray(`(${size})`), kleur.gray("from"), url);

					fs.writeFileSync(fullOutputLocation, result);
				}
			});
		}

		return {
			file: fullOutputLocation,
			url: `/${imageUrlLocation}`,
			promise: promise || Promise.resolve(),
		};
	}

	async fetch(url, options = {}, showErrors = true) {
		let opts = Object.assign({
			duration: this.#cacheDuration,
			type: "text",
			fetchOptions: {},
		}, options);

		if(!this.fetchedUrls.has(url)) {
			let logAdds = [];
			if(Boolean(options?.fetchOptions?.headers?.Authorization)) {
				logAdds.push(kleur.blue("Auth"));
			}
			if(opts.duration) {
				logAdds.push(kleur.green(`(${opts.duration} cache)`));
			}
			Logger.log(kleur.gray("Fetching"), url, logAdds.join(" ") );
			this.fetchedUrls.add(url);
		}

		if(!opts.fetchOptions.headers) {
			opts.fetchOptions.headers = {};
		}
		Object.assign(opts.fetchOptions.headers, {
			"user-agent": Fetcher.USER_AGENT
		});

		try {
			let result = await EleventyFetch(url, opts);

			if(opts.type === "xml") {
				return xmlParser.parse(result);
			}

			return result;
		} catch(e) {
			this.errors.add(url);

			if(showErrors) {
				Logger.log(kleur.red(`Error fetching`), url, kleur.red(e.message));
			}

			return Promise.reject(e);
		}
	}
}

export { Fetcher };