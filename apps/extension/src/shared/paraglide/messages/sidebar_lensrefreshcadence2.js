/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensrefreshcadence2Inputs */

const en_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refresh cadence`)
};

const es_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frecuencia de actualización`)
};

const pt_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadência de atualização`)
};

const fr_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fréquence d'actualisation`)
};

const de_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktualisierungsintervall`)
};

const ja_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`更新頻度`)
};

const ko_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새로 고침 주기`)
};

const zh_cn2_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`刷新频率`)
};

const ru_sidebar_lensrefreshcadence2 = /** @type {(inputs: Sidebar_Lensrefreshcadence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Частота обновления`)
};

/**
* | output |
* | --- |
* | "Refresh cadence" |
*
* @param {Sidebar_Lensrefreshcadence2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensrefreshcadence2 = /** @type {((inputs?: Sidebar_Lensrefreshcadence2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensrefreshcadence2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensrefreshcadence2(inputs)
	if (locale === "es") return es_sidebar_lensrefreshcadence2(inputs)
	if (locale === "pt") return pt_sidebar_lensrefreshcadence2(inputs)
	if (locale === "fr") return fr_sidebar_lensrefreshcadence2(inputs)
	if (locale === "de") return de_sidebar_lensrefreshcadence2(inputs)
	if (locale === "ja") return ja_sidebar_lensrefreshcadence2(inputs)
	if (locale === "ko") return ko_sidebar_lensrefreshcadence2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensrefreshcadence2(inputs)
	return ru_sidebar_lensrefreshcadence2(inputs)
});
export { sidebar_lensrefreshcadence2 as "sidebar_lensRefreshCadence" }