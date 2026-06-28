/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensmaxitems2Inputs */

const en_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Maximum items`)
};

const es_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Máximo de elementos`)
};

const pt_pt2_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Máximo de itens`)
};

const fr_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre maximum d'éléments`)
};

const de_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Maximale Elemente`)
};

const ja_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`最大アイテム数`)
};

const ko_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`최대 항목 수`)
};

const zh_cn2_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`最大条目数`)
};

const ru_sidebar_lensmaxitems2 = /** @type {(inputs: Sidebar_Lensmaxitems2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Максимум элементов`)
};

/**
* | output |
* | --- |
* | "Maximum items" |
*
* @param {Sidebar_Lensmaxitems2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensmaxitems2 = /** @type {((inputs?: Sidebar_Lensmaxitems2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensmaxitems2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensmaxitems2(inputs)
	if (locale === "es") return es_sidebar_lensmaxitems2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensmaxitems2(inputs)
	if (locale === "fr") return fr_sidebar_lensmaxitems2(inputs)
	if (locale === "de") return de_sidebar_lensmaxitems2(inputs)
	if (locale === "ja") return ja_sidebar_lensmaxitems2(inputs)
	if (locale === "ko") return ko_sidebar_lensmaxitems2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensmaxitems2(inputs)
	return ru_sidebar_lensmaxitems2(inputs)
});
export { sidebar_lensmaxitems2 as "sidebar_lensMaxItems" }