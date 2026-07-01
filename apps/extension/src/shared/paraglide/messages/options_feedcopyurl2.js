/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Feedcopyurl2Inputs */

const en_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy URL`)
};

const es_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar URL`)
};

const pt_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar URL`)
};

const fr_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier l'URL`)
};

const de_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL kopieren`)
};

const ja_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL をコピー`)
};

const ko_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL 복사`)
};

const zh_cn2_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`复制 URL`)
};

const ru_options_feedcopyurl2 = /** @type {(inputs: Options_Feedcopyurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Копировать URL`)
};

/**
* | output |
* | --- |
* | "Copy URL" |
*
* @param {Options_Feedcopyurl2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedcopyurl2 = /** @type {((inputs?: Options_Feedcopyurl2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedcopyurl2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_feedcopyurl2(inputs)
	if (locale === "es") return es_options_feedcopyurl2(inputs)
	if (locale === "pt") return pt_options_feedcopyurl2(inputs)
	if (locale === "fr") return fr_options_feedcopyurl2(inputs)
	if (locale === "de") return de_options_feedcopyurl2(inputs)
	if (locale === "ja") return ja_options_feedcopyurl2(inputs)
	if (locale === "ko") return ko_options_feedcopyurl2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_feedcopyurl2(inputs)
	return ru_options_feedcopyurl2(inputs)
});
export { options_feedcopyurl2 as "options_feedCopyUrl" }