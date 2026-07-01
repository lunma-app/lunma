/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensallcaughtup3Inputs */

const en_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You're all caught up.`)
};

const es_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estás al día.`)
};

const pt_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Está tudo em dia.`)
};

const fr_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout est à jour.`)
};

const de_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alles gelesen.`)
};

const ja_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべて確認済みです。`)
};

const ko_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 확인했습니다.`)
};

const zh_cn2_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`已全部阅完`)
};

const ru_sidebar_lensallcaughtup3 = /** @type {(inputs: Sidebar_Lensallcaughtup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Всё просмотрено.`)
};

/**
* | output |
* | --- |
* | "You're all caught up." |
*
* @param {Sidebar_Lensallcaughtup3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensallcaughtup3 = /** @type {((inputs?: Sidebar_Lensallcaughtup3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensallcaughtup3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensallcaughtup3(inputs)
	if (locale === "es") return es_sidebar_lensallcaughtup3(inputs)
	if (locale === "pt") return pt_sidebar_lensallcaughtup3(inputs)
	if (locale === "fr") return fr_sidebar_lensallcaughtup3(inputs)
	if (locale === "de") return de_sidebar_lensallcaughtup3(inputs)
	if (locale === "ja") return ja_sidebar_lensallcaughtup3(inputs)
	if (locale === "ko") return ko_sidebar_lensallcaughtup3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensallcaughtup3(inputs)
	return ru_sidebar_lensallcaughtup3(inputs)
});
export { sidebar_lensallcaughtup3 as "sidebar_lensAllCaughtUp" }