/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenscadence101Inputs */

const en_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Every 10 minutes`)
};

const es_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cada 10 minutos`)
};

const pt_pt2_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A cada 10 minutos`)
};

const fr_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les 10 minutes`)
};

const de_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle 10 Minuten`)
};

const ja_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`10分ごと`)
};

const ko_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`10분마다`)
};

const zh_cn2_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`每 10 分钟`)
};

const ru_sidebar_lenscadence101 = /** @type {(inputs: Sidebar_Lenscadence101Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Каждые 10 минут`)
};

/**
* | output |
* | --- |
* | "Every 10 minutes" |
*
* @param {Sidebar_Lenscadence101Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscadence101 = /** @type {((inputs?: Sidebar_Lenscadence101Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscadence101Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenscadence101(inputs)
	if (locale === "es") return es_sidebar_lenscadence101(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lenscadence101(inputs)
	if (locale === "fr") return fr_sidebar_lenscadence101(inputs)
	if (locale === "de") return de_sidebar_lenscadence101(inputs)
	if (locale === "ja") return ja_sidebar_lenscadence101(inputs)
	if (locale === "ko") return ko_sidebar_lenscadence101(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenscadence101(inputs)
	return ru_sidebar_lenscadence101(inputs)
});
export { sidebar_lenscadence101 as "sidebar_lensCadence10" }