/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Tabunpin1Inputs */

const en_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unpin`)
};

const es_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desfijar`)
};

const pt_pt2_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desafixar`)
};

const fr_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désépingler`)
};

const de_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lösen`)
};

const ja_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`固定解除`)
};

const ko_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`고정 해제`)
};

const zh_cn2_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`取消固定`)
};

const ru_sidebar_tabunpin1 = /** @type {(inputs: Sidebar_Tabunpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открепить`)
};

/**
* | output |
* | --- |
* | "Unpin" |
*
* @param {Sidebar_Tabunpin1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabunpin1 = /** @type {((inputs?: Sidebar_Tabunpin1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabunpin1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_tabunpin1(inputs)
	if (locale === "es") return es_sidebar_tabunpin1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_tabunpin1(inputs)
	if (locale === "fr") return fr_sidebar_tabunpin1(inputs)
	if (locale === "de") return de_sidebar_tabunpin1(inputs)
	if (locale === "ja") return ja_sidebar_tabunpin1(inputs)
	if (locale === "ko") return ko_sidebar_tabunpin1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_tabunpin1(inputs)
	return ru_sidebar_tabunpin1(inputs)
});
export { sidebar_tabunpin1 as "sidebar_tabUnpin" }