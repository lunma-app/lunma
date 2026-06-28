/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensmarkallread3Inputs */

const en_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mark all read`)
};

const es_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marcar todo como leído`)
};

const pt_pt2_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marcar tudo como lido`)
};

const fr_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout marquer comme lu`)
};

const de_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle als gelesen markieren`)
};

const ja_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべて既読にする`)
};

const ko_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 읽음으로 표시`)
};

const zh_cn2_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`全部标为已读`)
};

const ru_sidebar_lensmarkallread3 = /** @type {(inputs: Sidebar_Lensmarkallread3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Отметить всё прочитанным`)
};

/**
* | output |
* | --- |
* | "Mark all read" |
*
* @param {Sidebar_Lensmarkallread3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensmarkallread3 = /** @type {((inputs?: Sidebar_Lensmarkallread3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensmarkallread3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensmarkallread3(inputs)
	if (locale === "es") return es_sidebar_lensmarkallread3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensmarkallread3(inputs)
	if (locale === "fr") return fr_sidebar_lensmarkallread3(inputs)
	if (locale === "de") return de_sidebar_lensmarkallread3(inputs)
	if (locale === "ja") return ja_sidebar_lensmarkallread3(inputs)
	if (locale === "ko") return ko_sidebar_lensmarkallread3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensmarkallread3(inputs)
	return ru_sidebar_lensmarkallread3(inputs)
});
export { sidebar_lensmarkallread3 as "sidebar_lensMarkAllRead" }