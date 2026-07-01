/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenskindunread2Inputs */

const en_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`unread`)
};

const es_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`no leídas`)
};

const pt_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`não lidos`)
};

const fr_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`non lus`)
};

const de_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ungelesen`)
};

const ja_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`未読`)
};

const ko_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`읽지 않음`)
};

const zh_cn2_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`未读`)
};

const ru_sidebar_lenskindunread2 = /** @type {(inputs: Sidebar_Lenskindunread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`непрочитанных`)
};

/**
* | output |
* | --- |
* | "unread" |
*
* @param {Sidebar_Lenskindunread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenskindunread2 = /** @type {((inputs?: Sidebar_Lenskindunread2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenskindunread2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenskindunread2(inputs)
	if (locale === "es") return es_sidebar_lenskindunread2(inputs)
	if (locale === "pt") return pt_sidebar_lenskindunread2(inputs)
	if (locale === "fr") return fr_sidebar_lenskindunread2(inputs)
	if (locale === "de") return de_sidebar_lenskindunread2(inputs)
	if (locale === "ja") return ja_sidebar_lenskindunread2(inputs)
	if (locale === "ko") return ko_sidebar_lenskindunread2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenskindunread2(inputs)
	return ru_sidebar_lenskindunread2(inputs)
});
export { sidebar_lenskindunread2 as "sidebar_lensKindUnread" }