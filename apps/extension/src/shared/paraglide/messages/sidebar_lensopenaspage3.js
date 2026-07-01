/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensopenaspage3Inputs */

const en_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open as page`)
};

const es_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir como página`)
};

const pt_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir como página`)
};

const fr_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir comme page`)
};

const de_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Als Seite öffnen`)
};

const ja_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ページとして開く`)
};

const ko_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`페이지로 열기`)
};

const zh_cn2_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`作为页面打开`)
};

const ru_sidebar_lensopenaspage3 = /** @type {(inputs: Sidebar_Lensopenaspage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть как страницу`)
};

/**
* | output |
* | --- |
* | "Open as page" |
*
* @param {Sidebar_Lensopenaspage3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenaspage3 = /** @type {((inputs?: Sidebar_Lensopenaspage3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenaspage3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensopenaspage3(inputs)
	if (locale === "es") return es_sidebar_lensopenaspage3(inputs)
	if (locale === "pt") return pt_sidebar_lensopenaspage3(inputs)
	if (locale === "fr") return fr_sidebar_lensopenaspage3(inputs)
	if (locale === "de") return de_sidebar_lensopenaspage3(inputs)
	if (locale === "ja") return ja_sidebar_lensopenaspage3(inputs)
	if (locale === "ko") return ko_sidebar_lensopenaspage3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensopenaspage3(inputs)
	return ru_sidebar_lensopenaspage3(inputs)
});
export { sidebar_lensopenaspage3 as "sidebar_lensOpenAsPage" }