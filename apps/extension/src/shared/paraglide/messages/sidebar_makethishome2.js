/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Makethishome2Inputs */

const en_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make this home`)
};

const es_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hacer inicio aquí`)
};

const pt_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Definir como início`)
};

const fr_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir comme accueil`)
};

const de_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Als Startseite festlegen`)
};

const ja_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ここをホームにする`)
};

const ko_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`홈으로 설정`)
};

const zh_cn2_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`设为主页`)
};

const ru_sidebar_makethishome2 = /** @type {(inputs: Sidebar_Makethishome2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Сделать главной`)
};

/**
* | output |
* | --- |
* | "Make this home" |
*
* @param {Sidebar_Makethishome2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_makethishome2 = /** @type {((inputs?: Sidebar_Makethishome2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Makethishome2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_makethishome2(inputs)
	if (locale === "es") return es_sidebar_makethishome2(inputs)
	if (locale === "pt") return pt_sidebar_makethishome2(inputs)
	if (locale === "fr") return fr_sidebar_makethishome2(inputs)
	if (locale === "de") return de_sidebar_makethishome2(inputs)
	if (locale === "ja") return ja_sidebar_makethishome2(inputs)
	if (locale === "ko") return ko_sidebar_makethishome2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_makethishome2(inputs)
	return ru_sidebar_makethishome2(inputs)
});
export { sidebar_makethishome2 as "sidebar_makeThisHome" }