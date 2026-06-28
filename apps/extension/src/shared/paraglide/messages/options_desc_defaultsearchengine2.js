/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Defaultsearchengine2Inputs */

const en_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which engine the launcher searches a query with`)
};

const es_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Motor que usa el lanzador para buscar`)
};

const pt_pt2_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Motor que o launcher usa para pesquisar`)
};

const fr_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le moteur que le lanceur utilise pour une requête`)
};

const de_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Welche Suchmaschine der Launcher für Suchanfragen verwendet`)
};

const ja_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーでクエリを検索するエンジン`)
};

const ko_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처가 검색에 사용하는 검색 엔진`)
};

const zh_cn2_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`启动器用于搜索查询的引擎`)
};

const ru_options_desc_defaultsearchengine2 = /** @type {(inputs: Options_Desc_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поисковик, используемый лаунчером для запросов`)
};

/**
* | output |
* | --- |
* | "Which engine the launcher searches a query with" |
*
* @param {Options_Desc_Defaultsearchengine2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_defaultsearchengine2 = /** @type {((inputs?: Options_Desc_Defaultsearchengine2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Defaultsearchengine2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_defaultsearchengine2(inputs)
	if (locale === "es") return es_options_desc_defaultsearchengine2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_desc_defaultsearchengine2(inputs)
	if (locale === "fr") return fr_options_desc_defaultsearchengine2(inputs)
	if (locale === "de") return de_options_desc_defaultsearchengine2(inputs)
	if (locale === "ja") return ja_options_desc_defaultsearchengine2(inputs)
	if (locale === "ko") return ko_options_desc_defaultsearchengine2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_defaultsearchengine2(inputs)
	return ru_options_desc_defaultsearchengine2(inputs)
});
export { options_desc_defaultsearchengine2 as "options_desc_defaultSearchEngine" }