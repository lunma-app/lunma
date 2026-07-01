/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensgrantaccess2Inputs */

const en_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grant access`)
};

const es_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conceder acceso`)
};

const pt_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conceder acesso`)
};

const fr_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accorder l'accès`)
};

const de_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zugriff gewähren`)
};

const ja_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アクセスを許可`)
};

const ko_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`접근 허용`)
};

const zh_cn2_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`授予访问权限`)
};

const ru_sidebar_lensgrantaccess2 = /** @type {(inputs: Sidebar_Lensgrantaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Предоставить доступ`)
};

/**
* | output |
* | --- |
* | "Grant access" |
*
* @param {Sidebar_Lensgrantaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensgrantaccess2 = /** @type {((inputs?: Sidebar_Lensgrantaccess2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensgrantaccess2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensgrantaccess2(inputs)
	if (locale === "es") return es_sidebar_lensgrantaccess2(inputs)
	if (locale === "pt") return pt_sidebar_lensgrantaccess2(inputs)
	if (locale === "fr") return fr_sidebar_lensgrantaccess2(inputs)
	if (locale === "de") return de_sidebar_lensgrantaccess2(inputs)
	if (locale === "ja") return ja_sidebar_lensgrantaccess2(inputs)
	if (locale === "ko") return ko_sidebar_lensgrantaccess2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensgrantaccess2(inputs)
	return ru_sidebar_lensgrantaccess2(inputs)
});
export { sidebar_lensgrantaccess2 as "sidebar_lensGrantAccess" }