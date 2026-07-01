/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_DensityInputs */

const en_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Density`)
};

const es_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Densidad`)
};

const pt_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Densidade`)
};

const fr_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Densité`)
};

const de_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dichte`)
};

const ja_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`密度`)
};

const ko_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`밀도`)
};

const zh_cn2_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`密度`)
};

const ru_options_label_density = /** @type {(inputs: Options_Label_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Плотность`)
};

/**
* | output |
* | --- |
* | "Density" |
*
* @param {Options_Label_DensityInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_label_density = /** @type {((inputs?: Options_Label_DensityInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_DensityInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_density(inputs)
	if (locale === "es") return es_options_label_density(inputs)
	if (locale === "pt") return pt_options_label_density(inputs)
	if (locale === "fr") return fr_options_label_density(inputs)
	if (locale === "de") return de_options_label_density(inputs)
	if (locale === "ja") return ja_options_label_density(inputs)
	if (locale === "ko") return ko_options_label_density(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_density(inputs)
	return ru_options_label_density(inputs)
});