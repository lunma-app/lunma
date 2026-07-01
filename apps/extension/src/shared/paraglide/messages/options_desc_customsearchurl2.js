/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Customsearchurl2Inputs */

const en_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Used when the engine above is set to Custom — %s is the query`)
};

const es_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se usa cuando el motor de arriba está en Personalizado — %s es la consulta`)
};

const pt_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usado quando o motor acima está em Personalizado — %s é a pesquisa`)
};

const fr_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisé quand le moteur ci-dessus est Personnalisé — %s représente la requête`)
};

const de_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktiv wenn Suchmaschine auf Benutzerdefiniert gesetzt ist — %s ist die Suchanfrage`)
};

const ja_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`上のエンジンが「カスタム」のときに使用 — %s はクエリ`)
};

const ko_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`위 엔진이 사용자 정의로 설정된 경우 사용 — %s는 검색어`)
};

const zh_cn2_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`当上方引擎设为自定义时使用 — %s 为查询词`)
};

const ru_options_desc_customsearchurl2 = /** @type {(inputs: Options_Desc_Customsearchurl2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Используется при выборе «Произвольный» — %s заменяется запросом`)
};

/**
* | output |
* | --- |
* | "Used when the engine above is set to Custom — %s is the query" |
*
* @param {Options_Desc_Customsearchurl2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_customsearchurl2 = /** @type {((inputs?: Options_Desc_Customsearchurl2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Customsearchurl2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_customsearchurl2(inputs)
	if (locale === "es") return es_options_desc_customsearchurl2(inputs)
	if (locale === "pt") return pt_options_desc_customsearchurl2(inputs)
	if (locale === "fr") return fr_options_desc_customsearchurl2(inputs)
	if (locale === "de") return de_options_desc_customsearchurl2(inputs)
	if (locale === "ja") return ja_options_desc_customsearchurl2(inputs)
	if (locale === "ko") return ko_options_desc_customsearchurl2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_customsearchurl2(inputs)
	return ru_options_desc_customsearchurl2(inputs)
});
export { options_desc_customsearchurl2 as "options_desc_customSearchUrl" }