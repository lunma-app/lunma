/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ host: NonNullable<unknown> }} Sidebar_Lensneedsaccess2Inputs */

const en_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma needs access to ${i?.host}`)
};

const es_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma necesita acceso a ${i?.host}`)
};

const pt_pt2_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma precisa de acesso a ${i?.host}`)
};

const fr_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma a besoin d'accéder à ${i?.host}`)
};

const de_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma benötigt Zugriff auf ${i?.host}`)
};

const ja_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma には ${i?.host} へのアクセスが必要です`)
};

const ko_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma에서 ${i?.host}에 대한 접근이 필요합니다`)
};

const zh_cn2_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma 需要访问 ${i?.host}`)
};

const ru_sidebar_lensneedsaccess2 = /** @type {(inputs: Sidebar_Lensneedsaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lunma нужен доступ к ${i?.host}`)
};

/**
* | output |
* | --- |
* | "Lunma needs access to {host}" |
*
* @param {Sidebar_Lensneedsaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensneedsaccess2 = /** @type {((inputs: Sidebar_Lensneedsaccess2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensneedsaccess2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensneedsaccess2(inputs)
	if (locale === "es") return es_sidebar_lensneedsaccess2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensneedsaccess2(inputs)
	if (locale === "fr") return fr_sidebar_lensneedsaccess2(inputs)
	if (locale === "de") return de_sidebar_lensneedsaccess2(inputs)
	if (locale === "ja") return ja_sidebar_lensneedsaccess2(inputs)
	if (locale === "ko") return ko_sidebar_lensneedsaccess2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensneedsaccess2(inputs)
	return ru_sidebar_lensneedsaccess2(inputs)
});
export { sidebar_lensneedsaccess2 as "sidebar_lensNeedsAccess" }