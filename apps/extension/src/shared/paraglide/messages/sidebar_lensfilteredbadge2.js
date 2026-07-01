/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensfilteredbadge2Inputs */

const en_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtered`)
};

const es_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrado`)
};

const pt_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrado`)
};

const fr_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtré`)
};

const de_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gefiltert`)
};

const ja_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィルター中`)
};

const ko_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`필터됨`)
};

const zh_cn2_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`已过滤`)
};

const ru_sidebar_lensfilteredbadge2 = /** @type {(inputs: Sidebar_Lensfilteredbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Фильтр`)
};

/**
* | output |
* | --- |
* | "Filtered" |
*
* @param {Sidebar_Lensfilteredbadge2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensfilteredbadge2 = /** @type {((inputs?: Sidebar_Lensfilteredbadge2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensfilteredbadge2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensfilteredbadge2(inputs)
	if (locale === "es") return es_sidebar_lensfilteredbadge2(inputs)
	if (locale === "pt") return pt_sidebar_lensfilteredbadge2(inputs)
	if (locale === "fr") return fr_sidebar_lensfilteredbadge2(inputs)
	if (locale === "de") return de_sidebar_lensfilteredbadge2(inputs)
	if (locale === "ja") return ja_sidebar_lensfilteredbadge2(inputs)
	if (locale === "ko") return ko_sidebar_lensfilteredbadge2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensfilteredbadge2(inputs)
	return ru_sidebar_lensfilteredbadge2(inputs)
});
export { sidebar_lensfilteredbadge2 as "sidebar_lensFilteredBadge" }