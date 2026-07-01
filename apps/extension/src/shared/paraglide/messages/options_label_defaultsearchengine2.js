/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Defaultsearchengine2Inputs */

const en_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Default search engine`)
};

const es_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Motor de búsqueda predeterminado`)
};

const pt_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Motor de pesquisa padrão`)
};

const fr_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Moteur de recherche par défaut`)
};

const de_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard-Suchmaschine`)
};

const ja_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`デフォルト検索エンジン`)
};

const ko_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기본 검색 엔진`)
};

const zh_cn2_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`默认搜索引擎`)
};

const ru_options_label_defaultsearchengine2 = /** @type {(inputs: Options_Label_Defaultsearchengine2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поисковик по умолчанию`)
};

/**
* | output |
* | --- |
* | "Default search engine" |
*
* @param {Options_Label_Defaultsearchengine2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_defaultsearchengine2 = /** @type {((inputs?: Options_Label_Defaultsearchengine2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Defaultsearchengine2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_defaultsearchengine2(inputs)
	if (locale === "es") return es_options_label_defaultsearchengine2(inputs)
	if (locale === "pt") return pt_options_label_defaultsearchengine2(inputs)
	if (locale === "fr") return fr_options_label_defaultsearchengine2(inputs)
	if (locale === "de") return de_options_label_defaultsearchengine2(inputs)
	if (locale === "ja") return ja_options_label_defaultsearchengine2(inputs)
	if (locale === "ko") return ko_options_label_defaultsearchengine2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_defaultsearchengine2(inputs)
	return ru_options_label_defaultsearchengine2(inputs)
});
export { options_label_defaultsearchengine2 as "options_label_defaultSearchEngine" }