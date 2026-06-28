/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenssourcesearch2Inputs */

const en_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search sources…`)
};

const es_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar fuentes…`)
};

const pt_pt2_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Procurar fontes…`)
};

const fr_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des sources…`)
};

const de_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quellen suchen…`)
};

const ja_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ソースを検索…`)
};

const ko_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`소스 검색…`)
};

const zh_cn2_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`搜索来源…`)
};

const ru_sidebar_lenssourcesearch2 = /** @type {(inputs: Sidebar_Lenssourcesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поиск источников…`)
};

/**
* | output |
* | --- |
* | "Search sources…" |
*
* @param {Sidebar_Lenssourcesearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenssourcesearch2 = /** @type {((inputs?: Sidebar_Lenssourcesearch2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenssourcesearch2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenssourcesearch2(inputs)
	if (locale === "es") return es_sidebar_lenssourcesearch2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lenssourcesearch2(inputs)
	if (locale === "fr") return fr_sidebar_lenssourcesearch2(inputs)
	if (locale === "de") return de_sidebar_lenssourcesearch2(inputs)
	if (locale === "ja") return ja_sidebar_lenssourcesearch2(inputs)
	if (locale === "ko") return ko_sidebar_lenssourcesearch2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenssourcesearch2(inputs)
	return ru_sidebar_lenssourcesearch2(inputs)
});
export { sidebar_lenssourcesearch2 as "sidebar_lensSourceSearch" }