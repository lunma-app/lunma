/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensrolereviewing2Inputs */

const en_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reviewing`)
};

const es_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisando`)
};

const pt_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A rever`)
};

const fr_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révision`)
};

const de_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In Überprüfung`)
};

const ja_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`レビュー中`)
};

const ko_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검토 중`)
};

const zh_cn2_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`审阅中`)
};

const ru_sidebar_lensrolereviewing2 = /** @type {(inputs: Sidebar_Lensrolereviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`На проверке`)
};

/**
* | output |
* | --- |
* | "Reviewing" |
*
* @param {Sidebar_Lensrolereviewing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensrolereviewing2 = /** @type {((inputs?: Sidebar_Lensrolereviewing2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensrolereviewing2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensrolereviewing2(inputs)
	if (locale === "es") return es_sidebar_lensrolereviewing2(inputs)
	if (locale === "pt") return pt_sidebar_lensrolereviewing2(inputs)
	if (locale === "fr") return fr_sidebar_lensrolereviewing2(inputs)
	if (locale === "de") return de_sidebar_lensrolereviewing2(inputs)
	if (locale === "ja") return ja_sidebar_lensrolereviewing2(inputs)
	if (locale === "ko") return ko_sidebar_lensrolereviewing2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensrolereviewing2(inputs)
	return ru_sidebar_lensrolereviewing2(inputs)
});
export { sidebar_lensrolereviewing2 as "sidebar_lensRoleReviewing" }