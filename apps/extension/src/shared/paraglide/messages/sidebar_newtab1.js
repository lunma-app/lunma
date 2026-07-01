/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Newtab1Inputs */

const en_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Tab`)
};

const es_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva pestaña`)
};

const pt_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Novo separador`)
};

const fr_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvel onglet`)
};

const de_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neuer Tab`)
};

const ja_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新しいタブ`)
};

const ko_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 탭`)
};

const zh_cn2_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新标签页`)
};

const ru_sidebar_newtab1 = /** @type {(inputs: Sidebar_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Новая вкладка`)
};

/**
* | output |
* | --- |
* | "New Tab" |
*
* @param {Sidebar_Newtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_newtab1 = /** @type {((inputs?: Sidebar_Newtab1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Newtab1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_newtab1(inputs)
	if (locale === "es") return es_sidebar_newtab1(inputs)
	if (locale === "pt") return pt_sidebar_newtab1(inputs)
	if (locale === "fr") return fr_sidebar_newtab1(inputs)
	if (locale === "de") return de_sidebar_newtab1(inputs)
	if (locale === "ja") return ja_sidebar_newtab1(inputs)
	if (locale === "ko") return ko_sidebar_newtab1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_newtab1(inputs)
	return ru_sidebar_newtab1(inputs)
});
export { sidebar_newtab1 as "sidebar_newTab" }