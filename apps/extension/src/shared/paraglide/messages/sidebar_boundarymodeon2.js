/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Boundarymodeon2Inputs */

const en_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On`)
};

const es_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activado`)
};

const pt_pt2_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ligado`)
};

const fr_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activé`)
};

const de_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An`)
};

const ja_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`オン`)
};

const ko_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`켜기`)
};

const zh_cn2_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`开启`)
};

const ru_sidebar_boundarymodeon2 = /** @type {(inputs: Sidebar_Boundarymodeon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Вкл.`)
};

/**
* | output |
* | --- |
* | "On" |
*
* @param {Sidebar_Boundarymodeon2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarymodeon2 = /** @type {((inputs?: Sidebar_Boundarymodeon2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarymodeon2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_boundarymodeon2(inputs)
	if (locale === "es") return es_sidebar_boundarymodeon2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_boundarymodeon2(inputs)
	if (locale === "fr") return fr_sidebar_boundarymodeon2(inputs)
	if (locale === "de") return de_sidebar_boundarymodeon2(inputs)
	if (locale === "ja") return ja_sidebar_boundarymodeon2(inputs)
	if (locale === "ko") return ko_sidebar_boundarymodeon2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_boundarymodeon2(inputs)
	return ru_sidebar_boundarymodeon2(inputs)
});
export { sidebar_boundarymodeon2 as "sidebar_boundaryModeOn" }