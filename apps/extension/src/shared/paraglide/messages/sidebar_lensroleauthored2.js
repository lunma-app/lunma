/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensroleauthored2Inputs */

const en_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Authored`)
};

const es_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creados`)
};

const pt_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criados`)
};

const fr_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créés par moi`)
};

const de_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Von mir`)
};

const ja_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`作成済み`)
};

const ko_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`내가 작성`)
};

const zh_cn2_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`我创建的`)
};

const ru_sidebar_lensroleauthored2 = /** @type {(inputs: Sidebar_Lensroleauthored2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Мои`)
};

/**
* | output |
* | --- |
* | "Authored" |
*
* @param {Sidebar_Lensroleauthored2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensroleauthored2 = /** @type {((inputs?: Sidebar_Lensroleauthored2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensroleauthored2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensroleauthored2(inputs)
	if (locale === "es") return es_sidebar_lensroleauthored2(inputs)
	if (locale === "pt") return pt_sidebar_lensroleauthored2(inputs)
	if (locale === "fr") return fr_sidebar_lensroleauthored2(inputs)
	if (locale === "de") return de_sidebar_lensroleauthored2(inputs)
	if (locale === "ja") return ja_sidebar_lensroleauthored2(inputs)
	if (locale === "ko") return ko_sidebar_lensroleauthored2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensroleauthored2(inputs)
	return ru_sidebar_lensroleauthored2(inputs)
});
export { sidebar_lensroleauthored2 as "sidebar_lensRoleAuthored" }