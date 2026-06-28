/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Grouplabel_Appearance1Inputs */

const en_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appearance`)
};

const es_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apariencia`)
};

const pt_pt2_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aparência`)
};

const fr_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apparence`)
};

const de_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erscheinungsbild`)
};

const ja_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`外観`)
};

const ko_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모양`)
};

const zh_cn2_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`外观`)
};

const ru_options_grouplabel_appearance1 = /** @type {(inputs: Options_Grouplabel_Appearance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Внешний вид`)
};

/**
* | output |
* | --- |
* | "Appearance" |
*
* @param {Options_Grouplabel_Appearance1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_grouplabel_appearance1 = /** @type {((inputs?: Options_Grouplabel_Appearance1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Grouplabel_Appearance1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_grouplabel_appearance1(inputs)
	if (locale === "es") return es_options_grouplabel_appearance1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_grouplabel_appearance1(inputs)
	if (locale === "fr") return fr_options_grouplabel_appearance1(inputs)
	if (locale === "de") return de_options_grouplabel_appearance1(inputs)
	if (locale === "ja") return ja_options_grouplabel_appearance1(inputs)
	if (locale === "ko") return ko_options_grouplabel_appearance1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_grouplabel_appearance1(inputs)
	return ru_options_grouplabel_appearance1(inputs)
});
export { options_grouplabel_appearance1 as "options_groupLabel_appearance" }