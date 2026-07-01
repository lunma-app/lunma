/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Lensopenpagelabel3Inputs */

const en_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Open ${i?.name}`)
};

const es_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Abrir ${i?.name}`)
};

const pt_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Abrir ${i?.name}`)
};

const fr_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ouvrir ${i?.name}`)
};

const de_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} öffnen`)
};

const ja_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} を開く`)
};

const ko_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} 열기`)
};

const zh_cn2_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`打开 ${i?.name}`)
};

const ru_sidebar_lensopenpagelabel3 = /** @type {(inputs: Sidebar_Lensopenpagelabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Открыть ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Open {name}" |
*
* @param {Sidebar_Lensopenpagelabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenpagelabel3 = /** @type {((inputs: Sidebar_Lensopenpagelabel3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenpagelabel3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensopenpagelabel3(inputs)
	if (locale === "es") return es_sidebar_lensopenpagelabel3(inputs)
	if (locale === "pt") return pt_sidebar_lensopenpagelabel3(inputs)
	if (locale === "fr") return fr_sidebar_lensopenpagelabel3(inputs)
	if (locale === "de") return de_sidebar_lensopenpagelabel3(inputs)
	if (locale === "ja") return ja_sidebar_lensopenpagelabel3(inputs)
	if (locale === "ko") return ko_sidebar_lensopenpagelabel3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensopenpagelabel3(inputs)
	return ru_sidebar_lensopenpagelabel3(inputs)
});
export { sidebar_lensopenpagelabel3 as "sidebar_lensOpenPageLabel" }