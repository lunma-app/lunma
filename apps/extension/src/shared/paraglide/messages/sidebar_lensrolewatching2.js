/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensrolewatching2Inputs */

const en_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Watching`)
};

const es_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Siguiendo`)
};

const pt_pt2_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A observar`)
};

const fr_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Surveillance`)
};

const de_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beobachtet`)
};

const ja_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ウォッチ中`)
};

const ko_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`구독 중`)
};

const zh_cn2_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`关注中`)
};

const ru_sidebar_lensrolewatching2 = /** @type {(inputs: Sidebar_Lensrolewatching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Отслеживаемые`)
};

/**
* | output |
* | --- |
* | "Watching" |
*
* @param {Sidebar_Lensrolewatching2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensrolewatching2 = /** @type {((inputs?: Sidebar_Lensrolewatching2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensrolewatching2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensrolewatching2(inputs)
	if (locale === "es") return es_sidebar_lensrolewatching2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensrolewatching2(inputs)
	if (locale === "fr") return fr_sidebar_lensrolewatching2(inputs)
	if (locale === "de") return de_sidebar_lensrolewatching2(inputs)
	if (locale === "ja") return ja_sidebar_lensrolewatching2(inputs)
	if (locale === "ko") return ko_sidebar_lensrolewatching2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensrolewatching2(inputs)
	return ru_sidebar_lensrolewatching2(inputs)
});
export { sidebar_lensrolewatching2 as "sidebar_lensRoleWatching" }