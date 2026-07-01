/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Tint_StandardInputs */

const en_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const es_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estándar`)
};

const pt_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Padrão`)
};

const fr_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const de_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const ja_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`標準`)
};

const ko_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보통`)
};

const zh_cn2_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`标准`)
};

const ru_options_tint_standard = /** @type {(inputs: Options_Tint_StandardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Стандартный`)
};

/**
* | output |
* | --- |
* | "Standard" |
*
* @param {Options_Tint_StandardInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_tint_standard = /** @type {((inputs?: Options_Tint_StandardInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Tint_StandardInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_tint_standard(inputs)
	if (locale === "es") return es_options_tint_standard(inputs)
	if (locale === "pt") return pt_options_tint_standard(inputs)
	if (locale === "fr") return fr_options_tint_standard(inputs)
	if (locale === "de") return de_options_tint_standard(inputs)
	if (locale === "ja") return ja_options_tint_standard(inputs)
	if (locale === "ko") return ko_options_tint_standard(inputs)
	if (locale === "zh-CN") return zh_cn2_options_tint_standard(inputs)
	return ru_options_tint_standard(inputs)
});