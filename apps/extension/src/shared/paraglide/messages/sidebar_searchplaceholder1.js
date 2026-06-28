/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Searchplaceholder1Inputs */

const en_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search or enter URL…`)
};

const es_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar o introducir URL…`)
};

const pt_pt2_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pesquisar ou introduzir URL…`)
};

const fr_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher ou saisir une URL…`)
};

const de_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suchen oder URL eingeben…`)
};

const ja_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`検索または URL を入力…`)
};

const ko_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검색 또는 URL 입력…`)
};

const zh_cn2_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`搜索或输入 URL…`)
};

const ru_sidebar_searchplaceholder1 = /** @type {(inputs: Sidebar_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поиск или ввод URL…`)
};

/**
* | output |
* | --- |
* | "Search or enter URL…" |
*
* @param {Sidebar_Searchplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_searchplaceholder1 = /** @type {((inputs?: Sidebar_Searchplaceholder1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Searchplaceholder1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_searchplaceholder1(inputs)
	if (locale === "es") return es_sidebar_searchplaceholder1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_searchplaceholder1(inputs)
	if (locale === "fr") return fr_sidebar_searchplaceholder1(inputs)
	if (locale === "de") return de_sidebar_searchplaceholder1(inputs)
	if (locale === "ja") return ja_sidebar_searchplaceholder1(inputs)
	if (locale === "ko") return ko_sidebar_searchplaceholder1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_searchplaceholder1(inputs)
	return ru_sidebar_searchplaceholder1(inputs)
});
export { sidebar_searchplaceholder1 as "sidebar_searchPlaceholder" }