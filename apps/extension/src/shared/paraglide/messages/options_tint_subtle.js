/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Tint_SubtleInputs */

const en_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subtle`)
};

const es_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sutil`)
};

const pt_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subtil`)
};

const fr_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subtil`)
};

const de_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subtil`)
};

const ja_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`控えめ`)
};

const ko_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`은은하게`)
};

const zh_cn2_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`淡`)
};

const ru_options_tint_subtle = /** @type {(inputs: Options_Tint_SubtleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Слабый`)
};

/**
* | output |
* | --- |
* | "Subtle" |
*
* @param {Options_Tint_SubtleInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_tint_subtle = /** @type {((inputs?: Options_Tint_SubtleInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Tint_SubtleInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_tint_subtle(inputs)
	if (locale === "es") return es_options_tint_subtle(inputs)
	if (locale === "pt") return pt_options_tint_subtle(inputs)
	if (locale === "fr") return fr_options_tint_subtle(inputs)
	if (locale === "de") return de_options_tint_subtle(inputs)
	if (locale === "ja") return ja_options_tint_subtle(inputs)
	if (locale === "ko") return ko_options_tint_subtle(inputs)
	if (locale === "zh-CN") return zh_cn2_options_tint_subtle(inputs)
	return ru_options_tint_subtle(inputs)
});