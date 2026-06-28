/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Autoarchivemodeoff3Inputs */

const en_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Off`)
};

const es_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desactivado`)
};

const pt_pt2_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desligado`)
};

const fr_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désactivé`)
};

const de_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aus`)
};

const ja_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`オフ`)
};

const ko_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`끄기`)
};

const zh_cn2_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`关闭`)
};

const ru_sidebar_autoarchivemodeoff3 = /** @type {(inputs: Sidebar_Autoarchivemodeoff3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Выкл.`)
};

/**
* | output |
* | --- |
* | "Off" |
*
* @param {Sidebar_Autoarchivemodeoff3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivemodeoff3 = /** @type {((inputs?: Sidebar_Autoarchivemodeoff3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivemodeoff3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchivemodeoff3(inputs)
	if (locale === "es") return es_sidebar_autoarchivemodeoff3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_autoarchivemodeoff3(inputs)
	if (locale === "fr") return fr_sidebar_autoarchivemodeoff3(inputs)
	if (locale === "de") return de_sidebar_autoarchivemodeoff3(inputs)
	if (locale === "ja") return ja_sidebar_autoarchivemodeoff3(inputs)
	if (locale === "ko") return ko_sidebar_autoarchivemodeoff3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchivemodeoff3(inputs)
	return ru_sidebar_autoarchivemodeoff3(inputs)
});
export { sidebar_autoarchivemodeoff3 as "sidebar_autoArchiveModeOff" }