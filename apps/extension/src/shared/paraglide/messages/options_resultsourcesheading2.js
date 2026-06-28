/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Resultsourcesheading2Inputs */

const en_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Result sources`)
};

const es_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fuentes de resultados`)
};

const pt_pt2_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fontes de resultados`)
};

const fr_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sources de résultats`)
};

const de_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ergebnisquellen`)
};

const ja_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`検索ソース`)
};

const ko_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`결과 소스`)
};

const zh_cn2_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`结果来源`)
};

const ru_options_resultsourcesheading2 = /** @type {(inputs: Options_Resultsourcesheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Источники результатов`)
};

/**
* | output |
* | --- |
* | "Result sources" |
*
* @param {Options_Resultsourcesheading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_resultsourcesheading2 = /** @type {((inputs?: Options_Resultsourcesheading2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Resultsourcesheading2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_resultsourcesheading2(inputs)
	if (locale === "es") return es_options_resultsourcesheading2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_resultsourcesheading2(inputs)
	if (locale === "fr") return fr_options_resultsourcesheading2(inputs)
	if (locale === "de") return de_options_resultsourcesheading2(inputs)
	if (locale === "ja") return ja_options_resultsourcesheading2(inputs)
	if (locale === "ko") return ko_options_resultsourcesheading2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_resultsourcesheading2(inputs)
	return ru_options_resultsourcesheading2(inputs)
});
export { options_resultsourcesheading2 as "options_resultSourcesHeading" }