/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ host: NonNullable<unknown> }} Sidebar_Lenssigninto3Inputs */

const en_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Sign in to ${i?.host}`)
};

const es_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Iniciar sesión en ${i?.host}`)
};

const pt_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Iniciar sessão em ${i?.host}`)
};

const fr_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Se connecter à ${i?.host}`)
};

const de_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Bei ${i?.host} anmelden`)
};

const ja_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.host} にサインイン`)
};

const ko_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.host}에 로그인`)
};

const zh_cn2_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`登录 ${i?.host}`)
};

const ru_sidebar_lenssigninto3 = /** @type {(inputs: Sidebar_Lenssigninto3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Войти в ${i?.host}`)
};

/**
* | output |
* | --- |
* | "Sign in to {host}" |
*
* @param {Sidebar_Lenssigninto3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenssigninto3 = /** @type {((inputs: Sidebar_Lenssigninto3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenssigninto3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenssigninto3(inputs)
	if (locale === "es") return es_sidebar_lenssigninto3(inputs)
	if (locale === "pt") return pt_sidebar_lenssigninto3(inputs)
	if (locale === "fr") return fr_sidebar_lenssigninto3(inputs)
	if (locale === "de") return de_sidebar_lenssigninto3(inputs)
	if (locale === "ja") return ja_sidebar_lenssigninto3(inputs)
	if (locale === "ko") return ko_sidebar_lenssigninto3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenssigninto3(inputs)
	return ru_sidebar_lenssigninto3(inputs)
});
export { sidebar_lenssigninto3 as "sidebar_lensSignInTo" }