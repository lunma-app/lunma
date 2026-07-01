/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Gohome1Inputs */

const en_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go home`)
};

const es_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ir al inicio`)
};

const pt_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ir para início`)
};

const fr_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aller à l'accueil`)
};

const de_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zur Startseite`)
};

const ja_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ホームに戻る`)
};

const ko_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`홈으로`)
};

const zh_cn2_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`回到主页`)
};

const ru_sidebar_gohome1 = /** @type {(inputs: Sidebar_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Перейти на главную`)
};

/**
* | output |
* | --- |
* | "Go home" |
*
* @param {Sidebar_Gohome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_gohome1 = /** @type {((inputs?: Sidebar_Gohome1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Gohome1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_gohome1(inputs)
	if (locale === "es") return es_sidebar_gohome1(inputs)
	if (locale === "pt") return pt_sidebar_gohome1(inputs)
	if (locale === "fr") return fr_sidebar_gohome1(inputs)
	if (locale === "de") return de_sidebar_gohome1(inputs)
	if (locale === "ja") return ja_sidebar_gohome1(inputs)
	if (locale === "ko") return ko_sidebar_gohome1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_gohome1(inputs)
	return ru_sidebar_gohome1(inputs)
});
export { sidebar_gohome1 as "sidebar_goHome" }