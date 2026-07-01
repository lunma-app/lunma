/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Autoarchivemodecustom3Inputs */

const en_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom`)
};

const es_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizado`)
};

const pt_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizado`)
};

const fr_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisé`)
};

const de_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benutzerdefiniert`)
};

const ja_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`カスタム`)
};

const ko_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사용자 정의`)
};

const zh_cn2_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自定义`)
};

const ru_sidebar_autoarchivemodecustom3 = /** @type {(inputs: Sidebar_Autoarchivemodecustom3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Вручную`)
};

/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Sidebar_Autoarchivemodecustom3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivemodecustom3 = /** @type {((inputs?: Sidebar_Autoarchivemodecustom3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivemodecustom3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchivemodecustom3(inputs)
	if (locale === "es") return es_sidebar_autoarchivemodecustom3(inputs)
	if (locale === "pt") return pt_sidebar_autoarchivemodecustom3(inputs)
	if (locale === "fr") return fr_sidebar_autoarchivemodecustom3(inputs)
	if (locale === "de") return de_sidebar_autoarchivemodecustom3(inputs)
	if (locale === "ja") return ja_sidebar_autoarchivemodecustom3(inputs)
	if (locale === "ko") return ko_sidebar_autoarchivemodecustom3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchivemodecustom3(inputs)
	return ru_sidebar_autoarchivemodecustom3(inputs)
});
export { sidebar_autoarchivemodecustom3 as "sidebar_autoArchiveModeCustom" }