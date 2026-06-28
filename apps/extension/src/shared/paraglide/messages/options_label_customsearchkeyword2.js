/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Customsearchkeyword2Inputs */

const en_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom search keyword`)
};

const es_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Palabra clave de búsqueda personalizada`)
};

const pt_pt2_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Palavra-chave de pesquisa personalizada`)
};

const fr_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot-clé de recherche personnalisée`)
};

const de_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benutzerdefiniertes Suchschlüsselwort`)
};

const ja_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`カスタム検索キーワード`)
};

const ko_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사용자 정의 검색 키워드`)
};

const zh_cn2_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自定义搜索关键词`)
};

const ru_options_label_customsearchkeyword2 = /** @type {(inputs: Options_Label_Customsearchkeyword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ключевое слово произвольного поиска`)
};

/**
* | output |
* | --- |
* | "Custom search keyword" |
*
* @param {Options_Label_Customsearchkeyword2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_customsearchkeyword2 = /** @type {((inputs?: Options_Label_Customsearchkeyword2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Customsearchkeyword2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_customsearchkeyword2(inputs)
	if (locale === "es") return es_options_label_customsearchkeyword2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_label_customsearchkeyword2(inputs)
	if (locale === "fr") return fr_options_label_customsearchkeyword2(inputs)
	if (locale === "de") return de_options_label_customsearchkeyword2(inputs)
	if (locale === "ja") return ja_options_label_customsearchkeyword2(inputs)
	if (locale === "ko") return ko_options_label_customsearchkeyword2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_customsearchkeyword2(inputs)
	return ru_options_label_customsearchkeyword2(inputs)
});
export { options_label_customsearchkeyword2 as "options_label_customSearchKeyword" }