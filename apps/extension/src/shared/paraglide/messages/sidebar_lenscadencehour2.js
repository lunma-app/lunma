/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenscadencehour2Inputs */

const en_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Every hour`)
};

const es_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cada hora`)
};

const pt_pt2_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A cada hora`)
};

const fr_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les heures`)
};

const de_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jede Stunde`)
};

const ja_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1時間ごと`)
};

const ko_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1시간마다`)
};

const zh_cn2_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`每小时`)
};

const ru_sidebar_lenscadencehour2 = /** @type {(inputs: Sidebar_Lenscadencehour2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Каждый час`)
};

/**
* | output |
* | --- |
* | "Every hour" |
*
* @param {Sidebar_Lenscadencehour2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscadencehour2 = /** @type {((inputs?: Sidebar_Lenscadencehour2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscadencehour2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenscadencehour2(inputs)
	if (locale === "es") return es_sidebar_lenscadencehour2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lenscadencehour2(inputs)
	if (locale === "fr") return fr_sidebar_lenscadencehour2(inputs)
	if (locale === "de") return de_sidebar_lenscadencehour2(inputs)
	if (locale === "ja") return ja_sidebar_lenscadencehour2(inputs)
	if (locale === "ko") return ko_sidebar_lenscadencehour2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenscadencehour2(inputs)
	return ru_sidebar_lenscadencehour2(inputs)
});
export { sidebar_lenscadencehour2 as "sidebar_lensCadenceHour" }