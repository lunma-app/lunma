/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenscadence51Inputs */

const en_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Every 5 minutes`)
};

const es_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cada 5 minutos`)
};

const pt_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A cada 5 minutos`)
};

const fr_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les 5 minutes`)
};

const de_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle 5 Minuten`)
};

const ja_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5分ごと`)
};

const ko_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`5분마다`)
};

const zh_cn2_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`每 5 分钟`)
};

const ru_sidebar_lenscadence51 = /** @type {(inputs: Sidebar_Lenscadence51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Каждые 5 минут`)
};

/**
* | output |
* | --- |
* | "Every 5 minutes" |
*
* @param {Sidebar_Lenscadence51Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscadence51 = /** @type {((inputs?: Sidebar_Lenscadence51Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscadence51Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenscadence51(inputs)
	if (locale === "es") return es_sidebar_lenscadence51(inputs)
	if (locale === "pt") return pt_sidebar_lenscadence51(inputs)
	if (locale === "fr") return fr_sidebar_lenscadence51(inputs)
	if (locale === "de") return de_sidebar_lenscadence51(inputs)
	if (locale === "ja") return ja_sidebar_lenscadence51(inputs)
	if (locale === "ko") return ko_sidebar_lenscadence51(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenscadence51(inputs)
	return ru_sidebar_lenscadence51(inputs)
});
export { sidebar_lenscadence51 as "sidebar_lensCadence5" }