/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenskinditems2Inputs */

const en_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`items`)
};

const es_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`elementos`)
};

const pt_pt2_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`itens`)
};

const fr_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`éléments`)
};

const de_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elemente`)
};

const ja_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`件`)
};

const ko_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`항목`)
};

const zh_cn2_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`条`)
};

const ru_sidebar_lenskinditems2 = /** @type {(inputs: Sidebar_Lenskinditems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`элементов`)
};

/**
* | output |
* | --- |
* | "items" |
*
* @param {Sidebar_Lenskinditems2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenskinditems2 = /** @type {((inputs?: Sidebar_Lenskinditems2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenskinditems2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenskinditems2(inputs)
	if (locale === "es") return es_sidebar_lenskinditems2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lenskinditems2(inputs)
	if (locale === "fr") return fr_sidebar_lenskinditems2(inputs)
	if (locale === "de") return de_sidebar_lenskinditems2(inputs)
	if (locale === "ja") return ja_sidebar_lenskinditems2(inputs)
	if (locale === "ko") return ko_sidebar_lenskinditems2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenskinditems2(inputs)
	return ru_sidebar_lenskinditems2(inputs)
});
export { sidebar_lenskinditems2 as "sidebar_lensKindItems" }