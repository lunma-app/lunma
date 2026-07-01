/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spacecolor1Inputs */

const en_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color`)
};

const es_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color`)
};

const pt_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cor`)
};

const fr_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur`)
};

const de_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Farbe`)
};

const ja_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`カラー`)
};

const ko_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`색상`)
};

const zh_cn2_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`颜色`)
};

const ru_sidebar_spacecolor1 = /** @type {(inputs: Sidebar_Spacecolor1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Цвет`)
};

/**
* | output |
* | --- |
* | "Color" |
*
* @param {Sidebar_Spacecolor1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacecolor1 = /** @type {((inputs?: Sidebar_Spacecolor1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacecolor1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spacecolor1(inputs)
	if (locale === "es") return es_sidebar_spacecolor1(inputs)
	if (locale === "pt") return pt_sidebar_spacecolor1(inputs)
	if (locale === "fr") return fr_sidebar_spacecolor1(inputs)
	if (locale === "de") return de_sidebar_spacecolor1(inputs)
	if (locale === "ja") return ja_sidebar_spacecolor1(inputs)
	if (locale === "ko") return ko_sidebar_spacecolor1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spacecolor1(inputs)
	return ru_sidebar_spacecolor1(inputs)
});
export { sidebar_spacecolor1 as "sidebar_spaceColor" }