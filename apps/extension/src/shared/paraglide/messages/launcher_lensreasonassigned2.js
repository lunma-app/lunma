/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensreasonassigned2Inputs */

const en_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

const es_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

const pt_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

const fr_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

const de_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

const ja_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

const ko_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

const zh_cn2_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

const ru_launcher_lensreasonassigned2 = /** @type {(inputs: Launcher_Lensreasonassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`assigned to you`)
};

/**
* | output |
* | --- |
* | "assigned to you" |
*
* @param {Launcher_Lensreasonassigned2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensreasonassigned2 = /** @type {((inputs?: Launcher_Lensreasonassigned2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensreasonassigned2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensreasonassigned2(inputs)
	if (locale === "es") return es_launcher_lensreasonassigned2(inputs)
	if (locale === "pt") return pt_launcher_lensreasonassigned2(inputs)
	if (locale === "fr") return fr_launcher_lensreasonassigned2(inputs)
	if (locale === "de") return de_launcher_lensreasonassigned2(inputs)
	if (locale === "ja") return ja_launcher_lensreasonassigned2(inputs)
	if (locale === "ko") return ko_launcher_lensreasonassigned2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensreasonassigned2(inputs)
	return ru_launcher_lensreasonassigned2(inputs)
});
export { launcher_lensreasonassigned2 as "launcher_lensReasonAssigned" }