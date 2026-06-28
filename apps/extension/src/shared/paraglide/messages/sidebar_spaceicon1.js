/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spaceicon1Inputs */

const en_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icon`)
};

const es_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icono`)
};

const pt_pt2_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ícone`)
};

const fr_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icône`)
};

const de_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icon`)
};

const ja_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アイコン`)
};

const ko_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아이콘`)
};

const zh_cn2_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`图标`)
};

const ru_sidebar_spaceicon1 = /** @type {(inputs: Sidebar_Spaceicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Иконка`)
};

/**
* | output |
* | --- |
* | "Icon" |
*
* @param {Sidebar_Spaceicon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceicon1 = /** @type {((inputs?: Sidebar_Spaceicon1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceicon1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spaceicon1(inputs)
	if (locale === "es") return es_sidebar_spaceicon1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_spaceicon1(inputs)
	if (locale === "fr") return fr_sidebar_spaceicon1(inputs)
	if (locale === "de") return de_sidebar_spaceicon1(inputs)
	if (locale === "ja") return ja_sidebar_spaceicon1(inputs)
	if (locale === "ko") return ko_sidebar_spaceicon1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spaceicon1(inputs)
	return ru_sidebar_spaceicon1(inputs)
});
export { sidebar_spaceicon1 as "sidebar_spaceIcon" }