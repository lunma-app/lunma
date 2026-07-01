/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Authmethodpersonaltoken3Inputs */

const en_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal token`)
};

const es_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token personal`)
};

const pt_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token pessoal`)
};

const fr_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token personnel`)
};

const de_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Persönlicher Token`)
};

const ja_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`個人トークン`)
};

const ko_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개인 토큰`)
};

const zh_cn2_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`个人令牌`)
};

const ru_options_authmethodpersonaltoken3 = /** @type {(inputs: Options_Authmethodpersonaltoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Личный токен`)
};

/**
* | output |
* | --- |
* | "Personal token" |
*
* @param {Options_Authmethodpersonaltoken3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodpersonaltoken3 = /** @type {((inputs?: Options_Authmethodpersonaltoken3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodpersonaltoken3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_authmethodpersonaltoken3(inputs)
	if (locale === "es") return es_options_authmethodpersonaltoken3(inputs)
	if (locale === "pt") return pt_options_authmethodpersonaltoken3(inputs)
	if (locale === "fr") return fr_options_authmethodpersonaltoken3(inputs)
	if (locale === "de") return de_options_authmethodpersonaltoken3(inputs)
	if (locale === "ja") return ja_options_authmethodpersonaltoken3(inputs)
	if (locale === "ko") return ko_options_authmethodpersonaltoken3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_authmethodpersonaltoken3(inputs)
	return ru_options_authmethodpersonaltoken3(inputs)
});
export { options_authmethodpersonaltoken3 as "options_authMethodPersonalToken" }