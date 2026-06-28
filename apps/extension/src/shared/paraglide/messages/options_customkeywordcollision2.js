/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ keyword: NonNullable<unknown> }} Options_Customkeywordcollision2Inputs */

const en_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword} is a built-in keyword — the built-in wins.`)
};

const es_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword} es una palabra clave integrada — la integrada tiene prioridad.`)
};

const pt_pt2_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword} é uma palavra-chave integrada — a integrada prevalece.`)
};

const fr_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword} est un mot-clé intégré — le mot-clé intégré prévaut.`)
};

const de_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword} ist ein internes Schlüsselwort — das interne hat Vorrang.`)
};

const ja_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword} は組み込みキーワードです — 組み込みが優先されます。`)
};

const ko_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword}는 내장 키워드입니다 — 내장 키워드가 우선합니다.`)
};

const zh_cn2_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword} 是内置关键词 — 内置项优先`)
};

const ru_options_customkeywordcollision2 = /** @type {(inputs: Options_Customkeywordcollision2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.keyword} — встроенное ключевое слово, оно имеет приоритет.`)
};

/**
* | output |
* | --- |
* | "{keyword} is a built-in keyword — the built-in wins." |
*
* @param {Options_Customkeywordcollision2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_customkeywordcollision2 = /** @type {((inputs: Options_Customkeywordcollision2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Customkeywordcollision2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_customkeywordcollision2(inputs)
	if (locale === "es") return es_options_customkeywordcollision2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_customkeywordcollision2(inputs)
	if (locale === "fr") return fr_options_customkeywordcollision2(inputs)
	if (locale === "de") return de_options_customkeywordcollision2(inputs)
	if (locale === "ja") return ja_options_customkeywordcollision2(inputs)
	if (locale === "ko") return ko_options_customkeywordcollision2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_customkeywordcollision2(inputs)
	return ru_options_customkeywordcollision2(inputs)
});
export { options_customkeywordcollision2 as "options_customKeywordCollision" }