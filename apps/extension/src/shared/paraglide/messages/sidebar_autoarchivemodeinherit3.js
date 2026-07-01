/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Autoarchivemodeinherit3Inputs */

const en_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inherit`)
};

const es_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Heredar`)
};

const pt_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herdar`)
};

const fr_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hériter`)
};

const de_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Übernehmen`)
};

const ja_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`継承`)
};

const ko_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`상속`)
};

const zh_cn2_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`继承`)
};

const ru_sidebar_autoarchivemodeinherit3 = /** @type {(inputs: Sidebar_Autoarchivemodeinherit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Унаследовать`)
};

/**
* | output |
* | --- |
* | "Inherit" |
*
* @param {Sidebar_Autoarchivemodeinherit3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivemodeinherit3 = /** @type {((inputs?: Sidebar_Autoarchivemodeinherit3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivemodeinherit3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "es") return es_sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "pt") return pt_sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "fr") return fr_sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "de") return de_sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "ja") return ja_sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "ko") return ko_sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchivemodeinherit3(inputs)
	return ru_sidebar_autoarchivemodeinherit3(inputs)
});
export { sidebar_autoarchivemodeinherit3 as "sidebar_autoArchiveModeInherit" }