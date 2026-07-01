/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Accountaddtoken2Inputs */

const en_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add token`)
};

const es_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir token`)
};

const pt_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adicionar token`)
};

const fr_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un token`)
};

const de_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token hinzufügen`)
};

const ja_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`トークンを追加`)
};

const ko_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`토큰 추가`)
};

const zh_cn2_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`添加令牌`)
};

const ru_options_accountaddtoken2 = /** @type {(inputs: Options_Accountaddtoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Добавить токен`)
};

/**
* | output |
* | --- |
* | "Add token" |
*
* @param {Options_Accountaddtoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountaddtoken2 = /** @type {((inputs?: Options_Accountaddtoken2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountaddtoken2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_accountaddtoken2(inputs)
	if (locale === "es") return es_options_accountaddtoken2(inputs)
	if (locale === "pt") return pt_options_accountaddtoken2(inputs)
	if (locale === "fr") return fr_options_accountaddtoken2(inputs)
	if (locale === "de") return de_options_accountaddtoken2(inputs)
	if (locale === "ja") return ja_options_accountaddtoken2(inputs)
	if (locale === "ko") return ko_options_accountaddtoken2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_accountaddtoken2(inputs)
	return ru_options_accountaddtoken2(inputs)
});
export { options_accountaddtoken2 as "options_accountAddToken" }