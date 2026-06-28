/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Feedsgrouptitle2Inputs */

const en_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds`)
};

const es_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds`)
};

const pt_pt2_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds`)
};

const fr_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux`)
};

const de_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds`)
};

const ja_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィード`)
};

const ko_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`피드`)
};

const zh_cn2_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`订阅源`)
};

const ru_options_feedsgrouptitle2 = /** @type {(inputs: Options_Feedsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ленты`)
};

/**
* | output |
* | --- |
* | "Feeds" |
*
* @param {Options_Feedsgrouptitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedsgrouptitle2 = /** @type {((inputs?: Options_Feedsgrouptitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedsgrouptitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_feedsgrouptitle2(inputs)
	if (locale === "es") return es_options_feedsgrouptitle2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_feedsgrouptitle2(inputs)
	if (locale === "fr") return fr_options_feedsgrouptitle2(inputs)
	if (locale === "de") return de_options_feedsgrouptitle2(inputs)
	if (locale === "ja") return ja_options_feedsgrouptitle2(inputs)
	if (locale === "ko") return ko_options_feedsgrouptitle2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_feedsgrouptitle2(inputs)
	return ru_options_feedsgrouptitle2(inputs)
});
export { options_feedsgrouptitle2 as "options_feedsGroupTitle" }