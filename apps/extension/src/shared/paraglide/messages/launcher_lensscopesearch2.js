/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensscopesearch2Inputs */

const en_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search…`)
};

const es_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar…`)
};

const pt_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Procurar…`)
};

const fr_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher…`)
};

const de_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suchen…`)
};

const ja_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`検索…`)
};

const ko_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검색…`)
};

const zh_cn2_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`搜索…`)
};

const ru_launcher_lensscopesearch2 = /** @type {(inputs: Launcher_Lensscopesearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поиск…`)
};

/**
* | output |
* | --- |
* | "Search…" |
*
* @param {Launcher_Lensscopesearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensscopesearch2 = /** @type {((inputs?: Launcher_Lensscopesearch2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensscopesearch2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensscopesearch2(inputs)
	if (locale === "es") return es_launcher_lensscopesearch2(inputs)
	if (locale === "pt") return pt_launcher_lensscopesearch2(inputs)
	if (locale === "fr") return fr_launcher_lensscopesearch2(inputs)
	if (locale === "de") return de_launcher_lensscopesearch2(inputs)
	if (locale === "ja") return ja_launcher_lensscopesearch2(inputs)
	if (locale === "ko") return ko_launcher_lensscopesearch2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensscopesearch2(inputs)
	return ru_launcher_lensscopesearch2(inputs)
});
export { launcher_lensscopesearch2 as "launcher_lensScopeSearch" }