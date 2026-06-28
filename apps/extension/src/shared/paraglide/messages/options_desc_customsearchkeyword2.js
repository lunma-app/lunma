/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Customsearchkeyword2Inputs */

const en_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type this + Tab in the launcher to search your custom engine`)
};

const es_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escribe esto + Tab en el lanzador para buscar en tu motor personalizado`)
};

const pt_pt2_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escreva isto + Tab no launcher para pesquisar no motor personalizado`)
};

const fr_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tapez ceci + Tab dans le lanceur pour rechercher avec votre moteur personnalisé`)
};

const de_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Im Launcher eingeben + Tab, um die eigene Suchmaschine zu nutzen`)
};

const ja_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーでこれ + Tab を入力するとカスタムエンジンで検索`)
};

const ko_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처에서 이 키워드 + Tab을 입력하면 사용자 정의 엔진으로 검색`)
};

const zh_cn2_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`在启动器中输入此关键词 + Tab 以搜索自定义引擎`)
};

const ru_options_desc_customsearchkeyword2 = /** @type {(inputs: Options_Desc_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Введите это + Tab в лаунчере для поиска через свой поисковик`)
};

/**
* | output |
* | --- |
* | "Type this + Tab in the launcher to search your custom engine" |
*
* @param {Options_Desc_Customsearchkeyword2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_customsearchkeyword2 = /** @type {((inputs?: Options_Desc_Customsearchkeyword2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Customsearchkeyword2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_customsearchkeyword2(inputs)
	if (locale === "es") return es_options_desc_customsearchkeyword2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_desc_customsearchkeyword2(inputs)
	if (locale === "fr") return fr_options_desc_customsearchkeyword2(inputs)
	if (locale === "de") return de_options_desc_customsearchkeyword2(inputs)
	if (locale === "ja") return ja_options_desc_customsearchkeyword2(inputs)
	if (locale === "ko") return ko_options_desc_customsearchkeyword2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_customsearchkeyword2(inputs)
	return ru_options_desc_customsearchkeyword2(inputs)
});
export { options_desc_customsearchkeyword2 as "options_desc_customSearchKeyword" }