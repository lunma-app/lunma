/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensroleassigned2Inputs */

const en_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assigned`)
};

const es_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asignados`)
};

const pt_pt2_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atribuídos`)
};

const fr_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assignés à moi`)
};

const de_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zugewiesen`)
};

const ja_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`担当`)
};

const ko_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`나에게 할당`)
};

const zh_cn2_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`分配给我的`)
};

const ru_sidebar_lensroleassigned2 = /** @type {(inputs: Sidebar_Lensroleassigned2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Назначенные`)
};

/**
* | output |
* | --- |
* | "Assigned" |
*
* @param {Sidebar_Lensroleassigned2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensroleassigned2 = /** @type {((inputs?: Sidebar_Lensroleassigned2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensroleassigned2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensroleassigned2(inputs)
	if (locale === "es") return es_sidebar_lensroleassigned2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensroleassigned2(inputs)
	if (locale === "fr") return fr_sidebar_lensroleassigned2(inputs)
	if (locale === "de") return de_sidebar_lensroleassigned2(inputs)
	if (locale === "ja") return ja_sidebar_lensroleassigned2(inputs)
	if (locale === "ko") return ko_sidebar_lensroleassigned2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensroleassigned2(inputs)
	return ru_sidebar_lensroleassigned2(inputs)
});
export { sidebar_lensroleassigned2 as "sidebar_lensRoleAssigned" }