/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Density_NormalInputs */

const en_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal`)
};

const es_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal`)
};

const pt_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal`)
};

const fr_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal`)
};

const de_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal`)
};

const ja_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`標準`)
};

const ko_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보통`)
};

const zh_cn2_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`标准`)
};

const ru_options_density_normal = /** @type {(inputs: Options_Density_NormalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Обычный`)
};

/**
* | output |
* | --- |
* | "Normal" |
*
* @param {Options_Density_NormalInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_density_normal = /** @type {((inputs?: Options_Density_NormalInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Density_NormalInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_density_normal(inputs)
	if (locale === "es") return es_options_density_normal(inputs)
	if (locale === "pt") return pt_options_density_normal(inputs)
	if (locale === "fr") return fr_options_density_normal(inputs)
	if (locale === "de") return de_options_density_normal(inputs)
	if (locale === "ja") return ja_options_density_normal(inputs)
	if (locale === "ko") return ko_options_density_normal(inputs)
	if (locale === "zh-CN") return zh_cn2_options_density_normal(inputs)
	return ru_options_density_normal(inputs)
});