/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_TintInputs */

const en_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colour intensity`)
};

const es_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intensidad de color`)
};

const pt_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intensidade de cor`)
};

const fr_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intensité de couleur`)
};

const de_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Farbintensität`)
};

const ja_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`カラー強度`)
};

const ko_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`색상 강도`)
};

const zh_cn2_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`颜色强度`)
};

const ru_options_label_tint = /** @type {(inputs: Options_Label_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Насыщенность цвета`)
};

/**
* | output |
* | --- |
* | "Colour intensity" |
*
* @param {Options_Label_TintInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_label_tint = /** @type {((inputs?: Options_Label_TintInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_TintInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_tint(inputs)
	if (locale === "es") return es_options_label_tint(inputs)
	if (locale === "pt") return pt_options_label_tint(inputs)
	if (locale === "fr") return fr_options_label_tint(inputs)
	if (locale === "de") return de_options_label_tint(inputs)
	if (locale === "ja") return ja_options_label_tint(inputs)
	if (locale === "ko") return ko_options_label_tint(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_tint(inputs)
	return ru_options_label_tint(inputs)
});