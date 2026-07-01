/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensaddtoken2Inputs */

const en_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a token`)
};

const es_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir token`)
};

const pt_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adicionar token`)
};

const fr_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un token`)
};

const de_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token hinzufügen`)
};

const ja_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`トークンを追加`)
};

const ko_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`토큰 추가`)
};

const zh_cn2_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`添加令牌`)
};

const ru_sidebar_lensaddtoken2 = /** @type {(inputs: Sidebar_Lensaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Добавить токен`)
};

/**
* | output |
* | --- |
* | "Add a token" |
*
* @param {Sidebar_Lensaddtoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensaddtoken2 = /** @type {((inputs?: Sidebar_Lensaddtoken2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensaddtoken2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensaddtoken2(inputs)
	if (locale === "es") return es_sidebar_lensaddtoken2(inputs)
	if (locale === "pt") return pt_sidebar_lensaddtoken2(inputs)
	if (locale === "fr") return fr_sidebar_lensaddtoken2(inputs)
	if (locale === "de") return de_sidebar_lensaddtoken2(inputs)
	if (locale === "ja") return ja_sidebar_lensaddtoken2(inputs)
	if (locale === "ko") return ko_sidebar_lensaddtoken2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensaddtoken2(inputs)
	return ru_sidebar_lensaddtoken2(inputs)
});
export { sidebar_lensaddtoken2 as "sidebar_lensAddToken" }