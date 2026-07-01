/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spacename1Inputs */

const en_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const es_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre`)
};

const pt_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nome`)
};

const fr_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom`)
};

const de_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const ja_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`名前`)
};

const ko_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이름`)
};

const zh_cn2_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`名称`)
};

const ru_sidebar_spacename1 = /** @type {(inputs: Sidebar_Spacename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Название`)
};

/**
* | output |
* | --- |
* | "Name" |
*
* @param {Sidebar_Spacename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacename1 = /** @type {((inputs?: Sidebar_Spacename1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacename1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spacename1(inputs)
	if (locale === "es") return es_sidebar_spacename1(inputs)
	if (locale === "pt") return pt_sidebar_spacename1(inputs)
	if (locale === "fr") return fr_sidebar_spacename1(inputs)
	if (locale === "de") return de_sidebar_spacename1(inputs)
	if (locale === "ja") return ja_sidebar_spacename1(inputs)
	if (locale === "ko") return ko_sidebar_spacename1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spacename1(inputs)
	return ru_sidebar_spacename1(inputs)
});
export { sidebar_spacename1 as "sidebar_spaceName" }