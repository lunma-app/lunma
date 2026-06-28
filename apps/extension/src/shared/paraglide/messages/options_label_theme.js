/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_ThemeInputs */

const en_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Theme`)
};

const es_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tema`)
};

const pt_pt2_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tema`)
};

const fr_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Thème`)
};

const de_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Theme`)
};

const ja_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`テーマ`)
};

const ko_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`테마`)
};

const zh_cn2_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`主题`)
};

const ru_options_label_theme = /** @type {(inputs: Options_Label_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Тема`)
};

/**
* | output |
* | --- |
* | "Theme" |
*
* @param {Options_Label_ThemeInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_label_theme = /** @type {((inputs?: Options_Label_ThemeInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_ThemeInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_theme(inputs)
	if (locale === "es") return es_options_label_theme(inputs)
	if (locale === "pt-PT") return pt_pt2_options_label_theme(inputs)
	if (locale === "fr") return fr_options_label_theme(inputs)
	if (locale === "de") return de_options_label_theme(inputs)
	if (locale === "ja") return ja_options_label_theme(inputs)
	if (locale === "ko") return ko_options_label_theme(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_theme(inputs)
	return ru_options_label_theme(inputs)
});