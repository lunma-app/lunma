/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Boundaryurlplaceholder2Inputs */

const en_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

const es_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

const pt_pt2_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

const fr_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

const de_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

const ja_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

const ko_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

const zh_cn2_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

const ru_sidebar_boundaryurlplaceholder2 = /** @type {(inputs: Sidebar_Boundaryurlplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/inbox*`)
};

/**
* | output |
* | --- |
* | "https://example.com/inbox*" |
*
* @param {Sidebar_Boundaryurlplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundaryurlplaceholder2 = /** @type {((inputs?: Sidebar_Boundaryurlplaceholder2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundaryurlplaceholder2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "es") return es_sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "fr") return fr_sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "de") return de_sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "ja") return ja_sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "ko") return ko_sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_boundaryurlplaceholder2(inputs)
	return ru_sidebar_boundaryurlplaceholder2(inputs)
});
export { sidebar_boundaryurlplaceholder2 as "sidebar_boundaryUrlPlaceholder" }