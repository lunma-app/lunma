/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensreadfrom2Inputs */

const en_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read from`)
};

const es_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leer de`)
};

const pt_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ler de`)
};

const fr_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lire depuis`)
};

const de_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lesen von`)
};

const ja_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`読み込み元`)
};

const ko_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`읽어올 소스`)
};

const zh_cn2_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`读取来源`)
};

const ru_sidebar_lensreadfrom2 = /** @type {(inputs: Sidebar_Lensreadfrom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Читать из`)
};

/**
* | output |
* | --- |
* | "Read from" |
*
* @param {Sidebar_Lensreadfrom2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensreadfrom2 = /** @type {((inputs?: Sidebar_Lensreadfrom2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensreadfrom2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensreadfrom2(inputs)
	if (locale === "es") return es_sidebar_lensreadfrom2(inputs)
	if (locale === "pt") return pt_sidebar_lensreadfrom2(inputs)
	if (locale === "fr") return fr_sidebar_lensreadfrom2(inputs)
	if (locale === "de") return de_sidebar_lensreadfrom2(inputs)
	if (locale === "ja") return ja_sidebar_lensreadfrom2(inputs)
	if (locale === "ko") return ko_sidebar_lensreadfrom2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensreadfrom2(inputs)
	return ru_sidebar_lensreadfrom2(inputs)
});
export { sidebar_lensreadfrom2 as "sidebar_lensReadFrom" }