/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Tabmoveup2Inputs */

const en_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Move up`)
};

const es_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mover arriba`)
};

const pt_pt2_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mover para cima`)
};

const fr_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déplacer vers le haut`)
};

const de_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach oben`)
};

const ja_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`上に移動`)
};

const ko_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`위로 이동`)
};

const zh_cn2_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`上移`)
};

const ru_sidebar_tabmoveup2 = /** @type {(inputs: Sidebar_Tabmoveup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Вверх`)
};

/**
* | output |
* | --- |
* | "Move up" |
*
* @param {Sidebar_Tabmoveup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabmoveup2 = /** @type {((inputs?: Sidebar_Tabmoveup2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabmoveup2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_tabmoveup2(inputs)
	if (locale === "es") return es_sidebar_tabmoveup2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_tabmoveup2(inputs)
	if (locale === "fr") return fr_sidebar_tabmoveup2(inputs)
	if (locale === "de") return de_sidebar_tabmoveup2(inputs)
	if (locale === "ja") return ja_sidebar_tabmoveup2(inputs)
	if (locale === "ko") return ko_sidebar_tabmoveup2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_tabmoveup2(inputs)
	return ru_sidebar_tabmoveup2(inputs)
});
export { sidebar_tabmoveup2 as "sidebar_tabMoveUp" }