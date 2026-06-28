/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ engine: NonNullable<unknown>, query: NonNullable<unknown> }} Launcher_Enginerowtitle2Inputs */

const en_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Search ${i?.engine} for "${i?.query}"`)
};

const es_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Buscar "${i?.query}" en ${i?.engine}`)
};

const pt_pt2_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Pesquisar ${i?.engine} por "${i?.query}"`)
};

const fr_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rechercher "${i?.query}" avec ${i?.engine}`)
};

const de_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Mit ${i?.engine} nach "${i?.query}" suchen`)
};

const ja_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.engine} で「${i?.query}」を検索`)
};

const ko_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.engine}에서 "${i?.query}" 검색`)
};

const zh_cn2_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`在 ${i?.engine} 中搜索"${i?.query}"`)
};

const ru_launcher_enginerowtitle2 = /** @type {(inputs: Launcher_Enginerowtitle2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Поиск ${i?.engine} по «${i?.query}»`)
};

/**
* | output |
* | --- |
* | "Search {engine} for \"{query}\"" |
*
* @param {Launcher_Enginerowtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enginerowtitle2 = /** @type {((inputs: Launcher_Enginerowtitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enginerowtitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_enginerowtitle2(inputs)
	if (locale === "es") return es_launcher_enginerowtitle2(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_enginerowtitle2(inputs)
	if (locale === "fr") return fr_launcher_enginerowtitle2(inputs)
	if (locale === "de") return de_launcher_enginerowtitle2(inputs)
	if (locale === "ja") return ja_launcher_enginerowtitle2(inputs)
	if (locale === "ko") return ko_launcher_enginerowtitle2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_enginerowtitle2(inputs)
	return ru_launcher_enginerowtitle2(inputs)
});
export { launcher_enginerowtitle2 as "launcher_engineRowTitle" }