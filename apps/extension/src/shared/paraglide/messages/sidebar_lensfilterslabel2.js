/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensfilterslabel2Inputs */

const en_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filters`)
};

const es_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtros`)
};

const pt_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtros`)
};

const fr_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtres`)
};

const de_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filter`)
};

const ja_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィルター`)
};

const ko_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`필터`)
};

const zh_cn2_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`过滤器`)
};

const ru_sidebar_lensfilterslabel2 = /** @type {(inputs: Sidebar_Lensfilterslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Фильтры`)
};

/**
* | output |
* | --- |
* | "Filters" |
*
* @param {Sidebar_Lensfilterslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensfilterslabel2 = /** @type {((inputs?: Sidebar_Lensfilterslabel2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensfilterslabel2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensfilterslabel2(inputs)
	if (locale === "es") return es_sidebar_lensfilterslabel2(inputs)
	if (locale === "pt") return pt_sidebar_lensfilterslabel2(inputs)
	if (locale === "fr") return fr_sidebar_lensfilterslabel2(inputs)
	if (locale === "de") return de_sidebar_lensfilterslabel2(inputs)
	if (locale === "ja") return ja_sidebar_lensfilterslabel2(inputs)
	if (locale === "ko") return ko_sidebar_lensfilterslabel2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensfilterslabel2(inputs)
	return ru_sidebar_lensfilterslabel2(inputs)
});
export { sidebar_lensfilterslabel2 as "sidebar_lensFiltersLabel" }