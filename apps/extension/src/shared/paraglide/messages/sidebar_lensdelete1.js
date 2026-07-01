/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensdelete1Inputs */

const en_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete`)
};

const es_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const pt_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const de_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Löschen`)
};

const ja_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`削除`)
};

const ko_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`삭제`)
};

const zh_cn2_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`删除`)
};

const ru_sidebar_lensdelete1 = /** @type {(inputs: Sidebar_Lensdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Удалить`)
};

/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Sidebar_Lensdelete1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensdelete1 = /** @type {((inputs?: Sidebar_Lensdelete1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensdelete1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensdelete1(inputs)
	if (locale === "es") return es_sidebar_lensdelete1(inputs)
	if (locale === "pt") return pt_sidebar_lensdelete1(inputs)
	if (locale === "fr") return fr_sidebar_lensdelete1(inputs)
	if (locale === "de") return de_sidebar_lensdelete1(inputs)
	if (locale === "ja") return ja_sidebar_lensdelete1(inputs)
	if (locale === "ko") return ko_sidebar_lensdelete1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensdelete1(inputs)
	return ru_sidebar_lensdelete1(inputs)
});
export { sidebar_lensdelete1 as "sidebar_lensDelete" }