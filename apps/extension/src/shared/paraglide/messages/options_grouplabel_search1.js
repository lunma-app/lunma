/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Grouplabel_Search1Inputs */

const en_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search & launcher`)
};

const es_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Búsqueda y lanzador`)
};

const pt_pt2_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pesquisa e launcher`)
};

const fr_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherche & lanceur`)
};

const de_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suche & Launcher`)
};

const ja_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`検索 & ランチャー`)
};

const ko_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검색 및 런처`)
};

const zh_cn2_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`搜索与启动器`)
};

const ru_options_grouplabel_search1 = /** @type {(inputs: Options_Grouplabel_Search1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поиск и лаунчер`)
};

/**
* | output |
* | --- |
* | "Search & launcher" |
*
* @param {Options_Grouplabel_Search1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_grouplabel_search1 = /** @type {((inputs?: Options_Grouplabel_Search1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Grouplabel_Search1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_grouplabel_search1(inputs)
	if (locale === "es") return es_options_grouplabel_search1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_grouplabel_search1(inputs)
	if (locale === "fr") return fr_options_grouplabel_search1(inputs)
	if (locale === "de") return de_options_grouplabel_search1(inputs)
	if (locale === "ja") return ja_options_grouplabel_search1(inputs)
	if (locale === "ko") return ko_options_grouplabel_search1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_grouplabel_search1(inputs)
	return ru_options_grouplabel_search1(inputs)
});
export { options_grouplabel_search1 as "options_groupLabel_search" }