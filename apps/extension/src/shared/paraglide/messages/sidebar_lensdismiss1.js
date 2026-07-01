/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensdismiss1Inputs */

const en_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mark read`)
};

const es_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marcar como leído`)
};

const pt_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marcar como lido`)
};

const fr_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marquer comme lu`)
};

const de_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Als gelesen markieren`)
};

const ja_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`既読にする`)
};

const ko_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`읽음으로 표시`)
};

const zh_cn2_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`标为已读`)
};

const ru_sidebar_lensdismiss1 = /** @type {(inputs: Sidebar_Lensdismiss1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Отметить прочитанным`)
};

/**
* | output |
* | --- |
* | "Mark read" |
*
* @param {Sidebar_Lensdismiss1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensdismiss1 = /** @type {((inputs?: Sidebar_Lensdismiss1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensdismiss1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensdismiss1(inputs)
	if (locale === "es") return es_sidebar_lensdismiss1(inputs)
	if (locale === "pt") return pt_sidebar_lensdismiss1(inputs)
	if (locale === "fr") return fr_sidebar_lensdismiss1(inputs)
	if (locale === "de") return de_sidebar_lensdismiss1(inputs)
	if (locale === "ja") return ja_sidebar_lensdismiss1(inputs)
	if (locale === "ko") return ko_sidebar_lensdismiss1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensdismiss1(inputs)
	return ru_sidebar_lensdismiss1(inputs)
});
export { sidebar_lensdismiss1 as "sidebar_lensDismiss" }