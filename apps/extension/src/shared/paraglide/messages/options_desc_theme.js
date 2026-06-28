/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_ThemeInputs */

const en_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deep warm night, or frosted daylight.`)
};

const es_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noche cálida y profunda, o luz diurna helada.`)
};

const pt_pt2_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noite quente e profunda, ou luz do dia gelada.`)
};

const fr_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuit chaude et profonde, ou lumière froide du jour.`)
};

const de_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tiefe, warme Nacht oder frostiges Tageslicht.`)
};

const ja_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`深い暖かい夜、または白みがかった昼間。`)
};

const ko_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`깊고 따뜻한 밤 또는 서리낀 낮.`)
};

const zh_cn2_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`深暖夜色或磨砂日光`)
};

const ru_options_desc_theme = /** @type {(inputs: Options_Desc_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Тёмная тёплая ночь или морозный дневной свет.`)
};

/**
* | output |
* | --- |
* | "Deep warm night, or frosted daylight." |
*
* @param {Options_Desc_ThemeInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_desc_theme = /** @type {((inputs?: Options_Desc_ThemeInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_ThemeInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_theme(inputs)
	if (locale === "es") return es_options_desc_theme(inputs)
	if (locale === "pt-PT") return pt_pt2_options_desc_theme(inputs)
	if (locale === "fr") return fr_options_desc_theme(inputs)
	if (locale === "de") return de_options_desc_theme(inputs)
	if (locale === "ja") return ja_options_desc_theme(inputs)
	if (locale === "ko") return ko_options_desc_theme(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_theme(inputs)
	return ru_options_desc_theme(inputs)
});