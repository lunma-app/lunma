/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Theme_LightInputs */

const en_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Light`)
};

const es_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claro`)
};

const pt_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claro`)
};

const fr_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clair`)
};

const de_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hell`)
};

const ja_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ライト`)
};

const ko_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`밝게`)
};

const zh_cn2_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`浅色`)
};

const ru_options_theme_light = /** @type {(inputs: Options_Theme_LightInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Светлая`)
};

/**
* | output |
* | --- |
* | "Light" |
*
* @param {Options_Theme_LightInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_theme_light = /** @type {((inputs?: Options_Theme_LightInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Theme_LightInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_theme_light(inputs)
	if (locale === "es") return es_options_theme_light(inputs)
	if (locale === "pt") return pt_options_theme_light(inputs)
	if (locale === "fr") return fr_options_theme_light(inputs)
	if (locale === "de") return de_options_theme_light(inputs)
	if (locale === "ja") return ja_options_theme_light(inputs)
	if (locale === "ko") return ko_options_theme_light(inputs)
	if (locale === "zh-CN") return zh_cn2_options_theme_light(inputs)
	return ru_options_theme_light(inputs)
});