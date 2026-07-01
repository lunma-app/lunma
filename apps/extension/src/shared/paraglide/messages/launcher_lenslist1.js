/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lenslist1Inputs */

const en_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`List`)
};

const es_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lista`)
};

const pt_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lista`)
};

const fr_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liste`)
};

const de_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liste`)
};

const ja_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`リスト`)
};

const ko_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`목록`)
};

const zh_cn2_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`列表`)
};

const ru_launcher_lenslist1 = /** @type {(inputs: Launcher_Lenslist1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Список`)
};

/**
* | output |
* | --- |
* | "List" |
*
* @param {Launcher_Lenslist1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lenslist1 = /** @type {((inputs?: Launcher_Lenslist1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lenslist1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lenslist1(inputs)
	if (locale === "es") return es_launcher_lenslist1(inputs)
	if (locale === "pt") return pt_launcher_lenslist1(inputs)
	if (locale === "fr") return fr_launcher_lenslist1(inputs)
	if (locale === "de") return de_launcher_lenslist1(inputs)
	if (locale === "ja") return ja_launcher_lenslist1(inputs)
	if (locale === "ko") return ko_launcher_lenslist1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lenslist1(inputs)
	return ru_launcher_lenslist1(inputs)
});
export { launcher_lenslist1 as "launcher_lensList" }