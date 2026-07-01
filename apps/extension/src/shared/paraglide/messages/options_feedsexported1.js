/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Feedsexported1Inputs */

const en_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds exported`)
};

const es_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds exportados`)
};

const pt_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds exportados`)
};

const fr_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux exportés`)
};

const de_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds exportiert`)
};

const ja_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィードをエクスポートしました`)
};

const ko_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`피드 내보내기 완료`)
};

const zh_cn2_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`订阅源已导出`)
};

const ru_options_feedsexported1 = /** @type {(inputs: Options_Feedsexported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ленты экспортированы`)
};

/**
* | output |
* | --- |
* | "Feeds exported" |
*
* @param {Options_Feedsexported1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedsexported1 = /** @type {((inputs?: Options_Feedsexported1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedsexported1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_feedsexported1(inputs)
	if (locale === "es") return es_options_feedsexported1(inputs)
	if (locale === "pt") return pt_options_feedsexported1(inputs)
	if (locale === "fr") return fr_options_feedsexported1(inputs)
	if (locale === "de") return de_options_feedsexported1(inputs)
	if (locale === "ja") return ja_options_feedsexported1(inputs)
	if (locale === "ko") return ko_options_feedsexported1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_feedsexported1(inputs)
	return ru_options_feedsexported1(inputs)
});
export { options_feedsexported1 as "options_feedsExported" }