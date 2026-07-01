/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Tempmovedown2Inputs */

const en_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Move down`)
};

const es_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mover abajo`)
};

const pt_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mover para baixo`)
};

const fr_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déplacer vers le bas`)
};

const de_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach unten`)
};

const ja_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`下に移動`)
};

const ko_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아래로 이동`)
};

const zh_cn2_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`下移`)
};

const ru_sidebar_tempmovedown2 = /** @type {(inputs: Sidebar_Tempmovedown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Вниз`)
};

/**
* | output |
* | --- |
* | "Move down" |
*
* @param {Sidebar_Tempmovedown2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tempmovedown2 = /** @type {((inputs?: Sidebar_Tempmovedown2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tempmovedown2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_tempmovedown2(inputs)
	if (locale === "es") return es_sidebar_tempmovedown2(inputs)
	if (locale === "pt") return pt_sidebar_tempmovedown2(inputs)
	if (locale === "fr") return fr_sidebar_tempmovedown2(inputs)
	if (locale === "de") return de_sidebar_tempmovedown2(inputs)
	if (locale === "ja") return ja_sidebar_tempmovedown2(inputs)
	if (locale === "ko") return ko_sidebar_tempmovedown2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_tempmovedown2(inputs)
	return ru_sidebar_tempmovedown2(inputs)
});
export { sidebar_tempmovedown2 as "sidebar_tempMoveDown" }