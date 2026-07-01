/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Feedurlcopied2Inputs */

const en_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feed URL copied`)
};

const es_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL del feed copiada`)
};

const pt_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL do feed copiado`)
};

const fr_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL du flux copiée`)
};

const de_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feed-URL kopiert`)
};

const ja_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィード URL をコピーしました`)
};

const ko_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`피드 URL 복사됨`)
};

const zh_cn2_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`订阅源 URL 已复制`)
};

const ru_options_feedurlcopied2 = /** @type {(inputs: Options_Feedurlcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL ленты скопирован`)
};

/**
* | output |
* | --- |
* | "Feed URL copied" |
*
* @param {Options_Feedurlcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedurlcopied2 = /** @type {((inputs?: Options_Feedurlcopied2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedurlcopied2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_feedurlcopied2(inputs)
	if (locale === "es") return es_options_feedurlcopied2(inputs)
	if (locale === "pt") return pt_options_feedurlcopied2(inputs)
	if (locale === "fr") return fr_options_feedurlcopied2(inputs)
	if (locale === "de") return de_options_feedurlcopied2(inputs)
	if (locale === "ja") return ja_options_feedurlcopied2(inputs)
	if (locale === "ko") return ko_options_feedurlcopied2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_feedurlcopied2(inputs)
	return ru_options_feedurlcopied2(inputs)
});
export { options_feedurlcopied2 as "options_feedUrlCopied" }