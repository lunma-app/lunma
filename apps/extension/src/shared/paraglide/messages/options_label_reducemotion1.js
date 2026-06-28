/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Reducemotion1Inputs */

const en_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reduce motion`)
};

const es_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reducir movimiento`)
};

const pt_pt2_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reduzir movimento`)
};

const fr_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réduire les animations`)
};

const de_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bewegung reduzieren`)
};

const ja_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`モーション軽減`)
};

const ko_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모션 줄이기`)
};

const zh_cn2_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`减少动效`)
};

const ru_options_label_reducemotion1 = /** @type {(inputs: Options_Label_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Уменьшить анимацию`)
};

/**
* | output |
* | --- |
* | "Reduce motion" |
*
* @param {Options_Label_Reducemotion1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_reducemotion1 = /** @type {((inputs?: Options_Label_Reducemotion1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Reducemotion1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_reducemotion1(inputs)
	if (locale === "es") return es_options_label_reducemotion1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_label_reducemotion1(inputs)
	if (locale === "fr") return fr_options_label_reducemotion1(inputs)
	if (locale === "de") return de_options_label_reducemotion1(inputs)
	if (locale === "ja") return ja_options_label_reducemotion1(inputs)
	if (locale === "ko") return ko_options_label_reducemotion1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_reducemotion1(inputs)
	return ru_options_label_reducemotion1(inputs)
});
export { options_label_reducemotion1 as "options_label_reduceMotion" }