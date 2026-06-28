/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Searchgroupintro2Inputs */

const en_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How the launcher finds, ranks, and opens what you type.`)
};

const es_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo el lanzador encuentra, ordena y abre lo que escribes.`)
};

const pt_pt2_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Como o launcher encontra, classifica e abre o que escreve.`)
};

const fr_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment le lanceur trouve, classe et ouvre ce que vous tapez.`)
};

const de_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wie der Launcher findet, bewertet und öffnet, was du eingibst.`)
};

const ja_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーが入力した内容をどう検索・順位付け・開くかを設定。`)
};

const ko_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처가 입력한 내용을 검색하고 순위를 매겨 여는 방식입니다.`)
};

const zh_cn2_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`启动器的搜索、排序和打开方式`)
};

const ru_options_searchgroupintro2 = /** @type {(inputs: Options_Searchgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Как лаунчер ищет, ранжирует и открывает введённое.`)
};

/**
* | output |
* | --- |
* | "How the launcher finds, ranks, and opens what you type." |
*
* @param {Options_Searchgroupintro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_searchgroupintro2 = /** @type {((inputs?: Options_Searchgroupintro2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Searchgroupintro2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_searchgroupintro2(inputs)
	if (locale === "es") return es_options_searchgroupintro2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_searchgroupintro2(inputs)
	if (locale === "fr") return fr_options_searchgroupintro2(inputs)
	if (locale === "de") return de_options_searchgroupintro2(inputs)
	if (locale === "ja") return ja_options_searchgroupintro2(inputs)
	if (locale === "ko") return ko_options_searchgroupintro2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_searchgroupintro2(inputs)
	return ru_options_searchgroupintro2(inputs)
});
export { options_searchgroupintro2 as "options_searchGroupIntro" }