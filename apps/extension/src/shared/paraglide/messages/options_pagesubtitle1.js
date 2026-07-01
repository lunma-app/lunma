/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Pagesubtitle1Inputs */

const en_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Options`)
};

const es_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opciones`)
};

const pt_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opções`)
};

const fr_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Options`)
};

const de_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einstellungen`)
};

const ja_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`オプション`)
};

const ko_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`옵션`)
};

const zh_cn2_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`选项`)
};

const ru_options_pagesubtitle1 = /** @type {(inputs: Options_Pagesubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Настройки`)
};

/**
* | output |
* | --- |
* | "Options" |
*
* @param {Options_Pagesubtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_pagesubtitle1 = /** @type {((inputs?: Options_Pagesubtitle1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Pagesubtitle1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_pagesubtitle1(inputs)
	if (locale === "es") return es_options_pagesubtitle1(inputs)
	if (locale === "pt") return pt_options_pagesubtitle1(inputs)
	if (locale === "fr") return fr_options_pagesubtitle1(inputs)
	if (locale === "de") return de_options_pagesubtitle1(inputs)
	if (locale === "ja") return ja_options_pagesubtitle1(inputs)
	if (locale === "ko") return ko_options_pagesubtitle1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_pagesubtitle1(inputs)
	return ru_options_pagesubtitle1(inputs)
});
export { options_pagesubtitle1 as "options_pageSubtitle" }