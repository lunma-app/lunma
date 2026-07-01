/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Clearsearch1Inputs */

const en_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clear`)
};

const es_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Limpiar`)
};

const pt_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Limpar`)
};

const fr_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Effacer`)
};

const de_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Löschen`)
};

const ja_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`クリア`)
};

const ko_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지우기`)
};

const zh_cn2_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`清除`)
};

const ru_sidebar_clearsearch1 = /** @type {(inputs: Sidebar_Clearsearch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Очистить`)
};

/**
* | output |
* | --- |
* | "Clear" |
*
* @param {Sidebar_Clearsearch1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_clearsearch1 = /** @type {((inputs?: Sidebar_Clearsearch1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Clearsearch1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_clearsearch1(inputs)
	if (locale === "es") return es_sidebar_clearsearch1(inputs)
	if (locale === "pt") return pt_sidebar_clearsearch1(inputs)
	if (locale === "fr") return fr_sidebar_clearsearch1(inputs)
	if (locale === "de") return de_sidebar_clearsearch1(inputs)
	if (locale === "ja") return ja_sidebar_clearsearch1(inputs)
	if (locale === "ko") return ko_sidebar_clearsearch1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_clearsearch1(inputs)
	return ru_sidebar_clearsearch1(inputs)
});
export { sidebar_clearsearch1 as "sidebar_clearSearch" }