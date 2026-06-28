/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spacecolorlabel2Inputs */

const en_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Space color`)
};

const es_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color del espacio`)
};

const pt_pt2_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cor do Space`)
};

const fr_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur de l'espace`)
};

const de_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Space-Farbe`)
};

const ja_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`スペースのカラー`)
};

const ko_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`스페이스 색상`)
};

const zh_cn2_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`空间颜色`)
};

const ru_sidebar_spacecolorlabel2 = /** @type {(inputs: Sidebar_Spacecolorlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Цвет пространства`)
};

/**
* | output |
* | --- |
* | "Space color" |
*
* @param {Sidebar_Spacecolorlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacecolorlabel2 = /** @type {((inputs?: Sidebar_Spacecolorlabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacecolorlabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spacecolorlabel2(inputs)
	if (locale === "es") return es_sidebar_spacecolorlabel2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_spacecolorlabel2(inputs)
	if (locale === "fr") return fr_sidebar_spacecolorlabel2(inputs)
	if (locale === "de") return de_sidebar_spacecolorlabel2(inputs)
	if (locale === "ja") return ja_sidebar_spacecolorlabel2(inputs)
	if (locale === "ko") return ko_sidebar_spacecolorlabel2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spacecolorlabel2(inputs)
	return ru_sidebar_spacecolorlabel2(inputs)
});
export { sidebar_spacecolorlabel2 as "sidebar_spaceColorLabel" }