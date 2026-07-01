/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_LanguageInputs */

const en_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Language`)
};

const es_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Idioma`)
};

const pt_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Idioma`)
};

const fr_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Langue`)
};

const de_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sprache`)
};

const ja_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`言語`)
};

const ko_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`언어`)
};

const zh_cn2_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`语言`)
};

const ru_options_label_language = /** @type {(inputs: Options_Label_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Язык`)
};

/**
* | output |
* | --- |
* | "Language" |
*
* @param {Options_Label_LanguageInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_label_language = /** @type {((inputs?: Options_Label_LanguageInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_LanguageInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_language(inputs)
	if (locale === "es") return es_options_label_language(inputs)
	if (locale === "pt") return pt_options_label_language(inputs)
	if (locale === "fr") return fr_options_label_language(inputs)
	if (locale === "de") return de_options_label_language(inputs)
	if (locale === "ja") return ja_options_label_language(inputs)
	if (locale === "ko") return ko_options_label_language(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_language(inputs)
	return ru_options_label_language(inputs)
});