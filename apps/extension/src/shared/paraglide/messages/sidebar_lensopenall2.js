/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensopenall2Inputs */

const en_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open all in a tab`)
};

const es_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir todo en una pestaña`)
};

const pt_pt2_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir tudo num separador`)
};

const fr_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout ouvrir dans un onglet`)
};

const de_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle in einem Tab öffnen`)
};

const ja_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべてタブで開く`)
};

const ko_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭에서 모두 열기`)
};

const zh_cn2_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`在标签页中全部打开`)
};

const ru_sidebar_lensopenall2 = /** @type {(inputs: Sidebar_Lensopenall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть все во вкладке`)
};

/**
* | output |
* | --- |
* | "Open all in a tab" |
*
* @param {Sidebar_Lensopenall2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenall2 = /** @type {((inputs?: Sidebar_Lensopenall2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenall2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensopenall2(inputs)
	if (locale === "es") return es_sidebar_lensopenall2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensopenall2(inputs)
	if (locale === "fr") return fr_sidebar_lensopenall2(inputs)
	if (locale === "de") return de_sidebar_lensopenall2(inputs)
	if (locale === "ja") return ja_sidebar_lensopenall2(inputs)
	if (locale === "ko") return ko_sidebar_lensopenall2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensopenall2(inputs)
	return ru_sidebar_lensopenall2(inputs)
});
export { sidebar_lensopenall2 as "sidebar_lensOpenAll" }