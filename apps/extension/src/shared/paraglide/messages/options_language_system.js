/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Language_SystemInputs */

const en_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`System`)
};

const es_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sistema`)
};

const pt_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sistema`)
};

const fr_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Système`)
};

const de_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`System`)
};

const ja_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`システム`)
};

const ko_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시스템`)
};

const zh_cn2_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`跟随系统`)
};

const ru_options_language_system = /** @type {(inputs: Options_Language_SystemInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Системный`)
};

/**
* | output |
* | --- |
* | "System" |
*
* @param {Options_Language_SystemInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_language_system = /** @type {((inputs?: Options_Language_SystemInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Language_SystemInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_language_system(inputs)
	if (locale === "es") return es_options_language_system(inputs)
	if (locale === "pt") return pt_options_language_system(inputs)
	if (locale === "fr") return fr_options_language_system(inputs)
	if (locale === "de") return de_options_language_system(inputs)
	if (locale === "ja") return ja_options_language_system(inputs)
	if (locale === "ko") return ko_options_language_system(inputs)
	if (locale === "zh-CN") return zh_cn2_options_language_system(inputs)
	return ru_options_language_system(inputs)
});