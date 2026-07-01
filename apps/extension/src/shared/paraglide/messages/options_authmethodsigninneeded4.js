/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Authmethodsigninneeded4Inputs */

const en_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign-in needed`)
};

const es_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicio de sesión necesario`)
};

const pt_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Início de sessão necessário`)
};

const fr_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion requise`)
};

const de_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anmeldung erforderlich`)
};

const ja_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`サインインが必要`)
};

const ko_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로그인 필요`)
};

const zh_cn2_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`需要登录`)
};

const ru_options_authmethodsigninneeded4 = /** @type {(inputs: Options_Authmethodsigninneeded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Требуется вход`)
};

/**
* | output |
* | --- |
* | "Sign-in needed" |
*
* @param {Options_Authmethodsigninneeded4Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodsigninneeded4 = /** @type {((inputs?: Options_Authmethodsigninneeded4Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodsigninneeded4Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_authmethodsigninneeded4(inputs)
	if (locale === "es") return es_options_authmethodsigninneeded4(inputs)
	if (locale === "pt") return pt_options_authmethodsigninneeded4(inputs)
	if (locale === "fr") return fr_options_authmethodsigninneeded4(inputs)
	if (locale === "de") return de_options_authmethodsigninneeded4(inputs)
	if (locale === "ja") return ja_options_authmethodsigninneeded4(inputs)
	if (locale === "ko") return ko_options_authmethodsigninneeded4(inputs)
	if (locale === "zh-CN") return zh_cn2_options_authmethodsigninneeded4(inputs)
	return ru_options_authmethodsigninneeded4(inputs)
});
export { options_authmethodsigninneeded4 as "options_authMethodSignInNeeded" }