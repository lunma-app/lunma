/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Bookmarkslabel1Inputs */

const en_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bookmarks`)
};

const es_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marcadores`)
};

const pt_pt2_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marcadores`)
};

const fr_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marque-pages`)
};

const de_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lesezeichen`)
};

const ja_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ブックマーク`)
};

const ko_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`북마크`)
};

const zh_cn2_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`书签`)
};

const ru_options_bookmarkslabel1 = /** @type {(inputs: Options_Bookmarkslabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Закладки`)
};

/**
* | output |
* | --- |
* | "Bookmarks" |
*
* @param {Options_Bookmarkslabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_bookmarkslabel1 = /** @type {((inputs?: Options_Bookmarkslabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Bookmarkslabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_bookmarkslabel1(inputs)
	if (locale === "es") return es_options_bookmarkslabel1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_bookmarkslabel1(inputs)
	if (locale === "fr") return fr_options_bookmarkslabel1(inputs)
	if (locale === "de") return de_options_bookmarkslabel1(inputs)
	if (locale === "ja") return ja_options_bookmarkslabel1(inputs)
	if (locale === "ko") return ko_options_bookmarkslabel1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_bookmarkslabel1(inputs)
	return ru_options_bookmarkslabel1(inputs)
});
export { options_bookmarkslabel1 as "options_bookmarksLabel" }