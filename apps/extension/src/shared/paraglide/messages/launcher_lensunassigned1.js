/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensunassigned1Inputs */

const en_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

const es_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

const pt_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

const fr_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

const de_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

const ja_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

const ko_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

const zh_cn2_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

const ru_launcher_lensunassigned1 = /** @type {(inputs: Launcher_Lensunassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unassigned`)
};

/**
* | output |
* | --- |
* | "Unassigned" |
*
* @param {Launcher_Lensunassigned1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensunassigned1 = /** @type {((inputs?: Launcher_Lensunassigned1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensunassigned1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensunassigned1(inputs)
	if (locale === "es") return es_launcher_lensunassigned1(inputs)
	if (locale === "pt") return pt_launcher_lensunassigned1(inputs)
	if (locale === "fr") return fr_launcher_lensunassigned1(inputs)
	if (locale === "de") return de_launcher_lensunassigned1(inputs)
	if (locale === "ja") return ja_launcher_lensunassigned1(inputs)
	if (locale === "ko") return ko_launcher_lensunassigned1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensunassigned1(inputs)
	return ru_launcher_lensunassigned1(inputs)
});
export { launcher_lensunassigned1 as "launcher_lensUnassigned" }