/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensnameplaceholder2Inputs */

const en_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lens`)
};

const es_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lente`)
};

const pt_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lens`)
};

const fr_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vue`)
};

const de_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lens`)
};

const ja_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`レンズ`)
};

const ko_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`렌즈`)
};

const zh_cn2_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`镜头`)
};

const ru_sidebar_lensnameplaceholder2 = /** @type {(inputs: Sidebar_Lensnameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Линза`)
};

/**
* | output |
* | --- |
* | "Lens" |
*
* @param {Sidebar_Lensnameplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensnameplaceholder2 = /** @type {((inputs?: Sidebar_Lensnameplaceholder2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensnameplaceholder2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensnameplaceholder2(inputs)
	if (locale === "es") return es_sidebar_lensnameplaceholder2(inputs)
	if (locale === "pt") return pt_sidebar_lensnameplaceholder2(inputs)
	if (locale === "fr") return fr_sidebar_lensnameplaceholder2(inputs)
	if (locale === "de") return de_sidebar_lensnameplaceholder2(inputs)
	if (locale === "ja") return ja_sidebar_lensnameplaceholder2(inputs)
	if (locale === "ko") return ko_sidebar_lensnameplaceholder2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensnameplaceholder2(inputs)
	return ru_sidebar_lensnameplaceholder2(inputs)
});
export { sidebar_lensnameplaceholder2 as "sidebar_lensNamePlaceholder" }