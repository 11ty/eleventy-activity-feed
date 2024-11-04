import fs from "graceful-fs";

class DirectoryManager {
	static getDirectory(pathname) {
		let dirs = pathname.split("/");
		dirs.pop();
		return dirs.join("/");
	}

	constructor() {
		this.created = new Set();
	}

	createDirectoryForPath(pathname) {
		let dir = DirectoryManager.getDirectory(pathname);
		if(dir && !this.created.has(dir)) {
			fs.mkdirSync(dir, { recursive: true })

			this.created.add(dir);
		}
	}
}

export { DirectoryManager };