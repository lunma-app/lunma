/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenscadence301Inputs */

const en_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Every 30 minutes`)
};

const es_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cada 30 minutos`)
};

const pt_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A cada 30 minutos`)
};

const fr_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les 30 minutes`)
};

const de_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle 30 Minuten`)
};

const ja_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`30分ごと`)
};

const ko_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`30분마다`)
};

const zh_cn2_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`每 30 分钟`)
};

const ru_sidebar_lenscadence301 = /** @type {(inputs: Sidebar_Lenscadence301Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Каждые 30 минут`)
};

/**
* | output |
* | --- |
* | "Every 30 minutes" |
*
* @param {Sidebar_Lenscadence301Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscadence301 = /** @type {((inputs?: Sidebar_Lenscadence301Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscadence301Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenscadence301(inputs)
	if (locale === "es") return es_sidebar_lenscadence301(inputs)
	if (locale === "pt") return pt_sidebar_lenscadence301(inputs)
	if (locale === "fr") return fr_sidebar_lenscadence301(inputs)
	if (locale === "de") return de_sidebar_lenscadence301(inputs)
	if (locale === "ja") return ja_sidebar_lenscadence301(inputs)
	if (locale === "ko") return ko_sidebar_lenscadence301(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenscadence301(inputs)
	return ru_sidebar_lenscadence301(inputs)
});
export { sidebar_lenscadence301 as "sidebar_lensCadence30" }