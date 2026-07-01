/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensreasonreview2Inputs */

const en_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

const es_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

const pt_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

const fr_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

const de_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

const ja_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

const ko_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

const zh_cn2_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

const ru_launcher_lensreasonreview2 = /** @type {(inputs: Launcher_Lensreasonreview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`review requested`)
};

/**
* | output |
* | --- |
* | "review requested" |
*
* @param {Launcher_Lensreasonreview2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensreasonreview2 = /** @type {((inputs?: Launcher_Lensreasonreview2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensreasonreview2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensreasonreview2(inputs)
	if (locale === "es") return es_launcher_lensreasonreview2(inputs)
	if (locale === "pt") return pt_launcher_lensreasonreview2(inputs)
	if (locale === "fr") return fr_launcher_lensreasonreview2(inputs)
	if (locale === "de") return de_launcher_lensreasonreview2(inputs)
	if (locale === "ja") return ja_launcher_lensreasonreview2(inputs)
	if (locale === "ko") return ko_launcher_lensreasonreview2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensreasonreview2(inputs)
	return ru_launcher_lensreasonreview2(inputs)
});
export { launcher_lensreasonreview2 as "launcher_lensReasonReview" }