/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Tint_VividInputs */

const en_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vivid`)
};

const es_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vívido`)
};

const pt_pt2_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vivo`)
};

const fr_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vif`)
};

const de_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lebhaft`)
};

const ja_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ビビッド`)
};

const ko_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`선명하게`)
};

const zh_cn2_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`鲜艳`)
};

const ru_options_tint_vivid = /** @type {(inputs: Options_Tint_VividInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Насыщенный`)
};

/**
* | output |
* | --- |
* | "Vivid" |
*
* @param {Options_Tint_VividInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_tint_vivid = /** @type {((inputs?: Options_Tint_VividInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Tint_VividInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_tint_vivid(inputs)
	if (locale === "es") return es_options_tint_vivid(inputs)
	if (locale === "pt-PT") return pt_pt2_options_tint_vivid(inputs)
	if (locale === "fr") return fr_options_tint_vivid(inputs)
	if (locale === "de") return de_options_tint_vivid(inputs)
	if (locale === "ja") return ja_options_tint_vivid(inputs)
	if (locale === "ko") return ko_options_tint_vivid(inputs)
	if (locale === "zh-CN") return zh_cn2_options_tint_vivid(inputs)
	return ru_options_tint_vivid(inputs)
});