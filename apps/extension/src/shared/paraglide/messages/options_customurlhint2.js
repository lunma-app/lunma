/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Customurlhint2Inputs */

const en_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Include %s where the query goes.`)
};

const es_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incluye %s donde va la consulta.`)
};

const pt_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inclua %s onde vai a pesquisa.`)
};

const fr_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incluez %s à la place de la requête.`)
};

const de_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`%s dort einfügen, wo die Suchanfrage stehen soll.`)
};

const ja_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`クエリが入る場所に %s を含めてください。`)
};

const ko_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`검색어가 들어갈 위치에 %s를 입력하세요.`)
};

const zh_cn2_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`在查询词位置包含 %s`)
};

const ru_options_customurlhint2 = /** @type {(inputs: Options_Customurlhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Укажите %s там, куда вставляется запрос.`)
};

/**
* | output |
* | --- |
* | "Include %s where the query goes." |
*
* @param {Options_Customurlhint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_customurlhint2 = /** @type {((inputs?: Options_Customurlhint2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Customurlhint2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_customurlhint2(inputs)
	if (locale === "es") return es_options_customurlhint2(inputs)
	if (locale === "pt") return pt_options_customurlhint2(inputs)
	if (locale === "fr") return fr_options_customurlhint2(inputs)
	if (locale === "de") return de_options_customurlhint2(inputs)
	if (locale === "ja") return ja_options_customurlhint2(inputs)
	if (locale === "ko") return ko_options_customurlhint2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_customurlhint2(inputs)
	return ru_options_customurlhint2(inputs)
});
export { options_customurlhint2 as "options_customUrlHint" }