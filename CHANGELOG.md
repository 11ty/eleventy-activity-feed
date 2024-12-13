# `@11ty/eleventy-activity-feed` Changelog

## v2.0.0

- Most of the code in this repo has been moved to `@11ty/import` and we’re consuming that as a dependency.
- Properties in objects  returned from `getEntries` method have changed:
	- `label` is now `sourceLabel`
	- `title` no longer has `label` as a prefix.
- This unlocks use of any source types in `@11ty/import`: https://github.com/11ty/eleventy-import#service-types