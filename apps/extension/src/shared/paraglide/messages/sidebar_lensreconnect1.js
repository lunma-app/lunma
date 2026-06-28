/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ host: NonNullable<unknown> }} Sidebar_Lensreconnect1Inputs */

const en_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Reconnect ${i?.host}`)
};

const es_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Reconectar ${i?.host}`)
};

const pt_pt2_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Reconectar ${i?.host}`)
};

const fr_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Reconnecter ${i?.host}`)
};

const de_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.host} neu verbinden`)
};

const ja_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.host} に再接続`)
};

const ko_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.host} 재연결`)
};

const zh_cn2_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`重新连接 ${i?.host}`)
};

const ru_sidebar_lensreconnect1 = /** @type {(inputs: Sidebar_Lensreconnect1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Переподключить ${i?.host}`)
};

/**
* | output |
* | --- |
* | "Reconnect {host}" |
*
* @param {Sidebar_Lensreconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensreconnect1 = /** @type {((inputs: Sidebar_Lensreconnect1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensreconnect1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensreconnect1(inputs)
	if (locale === "es") return es_sidebar_lensreconnect1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensreconnect1(inputs)
	if (locale === "fr") return fr_sidebar_lensreconnect1(inputs)
	if (locale === "de") return de_sidebar_lensreconnect1(inputs)
	if (locale === "ja") return ja_sidebar_lensreconnect1(inputs)
	if (locale === "ko") return ko_sidebar_lensreconnect1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensreconnect1(inputs)
	return ru_sidebar_lensreconnect1(inputs)
});
export { sidebar_lensreconnect1 as "sidebar_lensReconnect" }