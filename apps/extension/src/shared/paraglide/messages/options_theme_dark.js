/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Theme_DarkInputs */

const en_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dark`)
};

const es_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oscuro`)
};

const pt_pt2_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escuro`)
};

const fr_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sombre`)
};

const de_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dunkel`)
};

const ja_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ダーク`)
};

const ko_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`어둡게`)
};

const zh_cn2_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`深色`)
};

const ru_options_theme_dark = /** @type {(inputs: Options_Theme_DarkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Тёмная`)
};

/**
* | output |
* | --- |
* | "Dark" |
*
* @param {Options_Theme_DarkInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_theme_dark = /** @type {((inputs?: Options_Theme_DarkInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Theme_DarkInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_theme_dark(inputs)
	if (locale === "es") return es_options_theme_dark(inputs)
	if (locale === "pt-PT") return pt_pt2_options_theme_dark(inputs)
	if (locale === "fr") return fr_options_theme_dark(inputs)
	if (locale === "de") return de_options_theme_dark(inputs)
	if (locale === "ja") return ja_options_theme_dark(inputs)
	if (locale === "ko") return ko_options_theme_dark(inputs)
	if (locale === "zh-CN") return zh_cn2_options_theme_dark(inputs)
	return ru_options_theme_dark(inputs)
});