/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Customsearchurl2Inputs */

const en_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom search URL`)
};

const es_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de búsqueda personalizada`)
};

const pt_pt2_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de pesquisa personalizada`)
};

const fr_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de recherche personnalisée`)
};

const de_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benutzerdefinierte Such-URL`)
};

const ja_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`カスタム検索 URL`)
};

const ko_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사용자 정의 검색 URL`)
};

const zh_cn2_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自定义搜索 URL`)
};

const ru_options_label_customsearchurl2 = /** @type {(inputs: Options_Label_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL произвольного поиска`)
};

/**
* | output |
* | --- |
* | "Custom search URL" |
*
* @param {Options_Label_Customsearchurl2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_customsearchurl2 = /** @type {((inputs?: Options_Label_Customsearchurl2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Customsearchurl2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_customsearchurl2(inputs)
	if (locale === "es") return es_options_label_customsearchurl2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_label_customsearchurl2(inputs)
	if (locale === "fr") return fr_options_label_customsearchurl2(inputs)
	if (locale === "de") return de_options_label_customsearchurl2(inputs)
	if (locale === "ja") return ja_options_label_customsearchurl2(inputs)
	if (locale === "ko") return ko_options_label_customsearchurl2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_customsearchurl2(inputs)
	return ru_options_label_customsearchurl2(inputs)
});
export { options_label_customsearchurl2 as "options_label_customSearchUrl" }