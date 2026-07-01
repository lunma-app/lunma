/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Authmethodtokenneeded3Inputs */

const en_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token needed`)
};

const es_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token necesario`)
};

const pt_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token necessário`)
};

const fr_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token requis`)
};

const de_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token erforderlich`)
};

const ja_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`トークンが必要`)
};

const ko_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`토큰 필요`)
};

const zh_cn2_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`需要令牌`)
};

const ru_options_authmethodtokenneeded3 = /** @type {(inputs: Options_Authmethodtokenneeded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Требуется токен`)
};

/**
* | output |
* | --- |
* | "Token needed" |
*
* @param {Options_Authmethodtokenneeded3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodtokenneeded3 = /** @type {((inputs?: Options_Authmethodtokenneeded3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodtokenneeded3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_authmethodtokenneeded3(inputs)
	if (locale === "es") return es_options_authmethodtokenneeded3(inputs)
	if (locale === "pt") return pt_options_authmethodtokenneeded3(inputs)
	if (locale === "fr") return fr_options_authmethodtokenneeded3(inputs)
	if (locale === "de") return de_options_authmethodtokenneeded3(inputs)
	if (locale === "ja") return ja_options_authmethodtokenneeded3(inputs)
	if (locale === "ko") return ko_options_authmethodtokenneeded3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_authmethodtokenneeded3(inputs)
	return ru_options_authmethodtokenneeded3(inputs)
});
export { options_authmethodtokenneeded3 as "options_authMethodTokenNeeded" }