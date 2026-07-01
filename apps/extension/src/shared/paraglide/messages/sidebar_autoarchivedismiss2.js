/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Autoarchivedismiss2Inputs */

const en_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Got it`)
};

const es_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entendido`)
};

const pt_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entendido`)
};

const fr_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compris`)
};

const de_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verstanden`)
};

const ja_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`了解`)
};

const ko_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인`)
};

const zh_cn2_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`知道了`)
};

const ru_sidebar_autoarchivedismiss2 = /** @type {(inputs: Sidebar_Autoarchivedismiss2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Понятно`)
};

/**
* | output |
* | --- |
* | "Got it" |
*
* @param {Sidebar_Autoarchivedismiss2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivedismiss2 = /** @type {((inputs?: Sidebar_Autoarchivedismiss2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivedismiss2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchivedismiss2(inputs)
	if (locale === "es") return es_sidebar_autoarchivedismiss2(inputs)
	if (locale === "pt") return pt_sidebar_autoarchivedismiss2(inputs)
	if (locale === "fr") return fr_sidebar_autoarchivedismiss2(inputs)
	if (locale === "de") return de_sidebar_autoarchivedismiss2(inputs)
	if (locale === "ja") return ja_sidebar_autoarchivedismiss2(inputs)
	if (locale === "ko") return ko_sidebar_autoarchivedismiss2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchivedismiss2(inputs)
	return ru_sidebar_autoarchivedismiss2(inputs)
});
export { sidebar_autoarchivedismiss2 as "sidebar_autoArchiveDismiss" }