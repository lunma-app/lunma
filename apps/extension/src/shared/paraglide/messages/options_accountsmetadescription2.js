/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Accountsmetadescription2Inputs */

const en_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sign-in identities, reused everywhere`)
};

const es_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`identidades de sesión, reutilizadas en todas partes`)
};

const pt_pt2_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`identidades de sessão, reutilizadas em todo o lado`)
};

const fr_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`identités de connexion, réutilisées partout`)
};

const de_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anmeldeidentitäten, überall wiederverwendet`)
};

const ja_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`サインイン ID、どこでも再利用可能`)
};

const ko_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로그인 계정, 어디서나 재사용`)
};

const zh_cn2_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`登录身份，随处复用`)
};

const ru_options_accountsmetadescription2 = /** @type {(inputs: Options_Accountsmetadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`учётные записи, используемые везде`)
};

/**
* | output |
* | --- |
* | "sign-in identities, reused everywhere" |
*
* @param {Options_Accountsmetadescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountsmetadescription2 = /** @type {((inputs?: Options_Accountsmetadescription2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountsmetadescription2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_accountsmetadescription2(inputs)
	if (locale === "es") return es_options_accountsmetadescription2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_accountsmetadescription2(inputs)
	if (locale === "fr") return fr_options_accountsmetadescription2(inputs)
	if (locale === "de") return de_options_accountsmetadescription2(inputs)
	if (locale === "ja") return ja_options_accountsmetadescription2(inputs)
	if (locale === "ko") return ko_options_accountsmetadescription2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_accountsmetadescription2(inputs)
	return ru_options_accountsmetadescription2(inputs)
});
export { options_accountsmetadescription2 as "options_accountsMetaDescription" }