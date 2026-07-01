/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenswillshow2Inputs */

const en_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This lens will show`)
};

const es_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta lente mostrará`)
};

const pt_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta lens irá mostrar`)
};

const fr_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette vue affichera`)
};

const de_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diese Lens zeigt`)
};

const ja_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このレンズに表示`)
};

const ko_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 렌즈가 표시할 내용`)
};

const zh_cn2_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`此镜头将显示`)
};

const ru_sidebar_lenswillshow2 = /** @type {(inputs: Sidebar_Lenswillshow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Эта линза покажет`)
};

/**
* | output |
* | --- |
* | "This lens will show" |
*
* @param {Sidebar_Lenswillshow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenswillshow2 = /** @type {((inputs?: Sidebar_Lenswillshow2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenswillshow2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenswillshow2(inputs)
	if (locale === "es") return es_sidebar_lenswillshow2(inputs)
	if (locale === "pt") return pt_sidebar_lenswillshow2(inputs)
	if (locale === "fr") return fr_sidebar_lenswillshow2(inputs)
	if (locale === "de") return de_sidebar_lenswillshow2(inputs)
	if (locale === "ja") return ja_sidebar_lenswillshow2(inputs)
	if (locale === "ko") return ko_sidebar_lenswillshow2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenswillshow2(inputs)
	return ru_sidebar_lenswillshow2(inputs)
});
export { sidebar_lenswillshow2 as "sidebar_lensWillShow" }