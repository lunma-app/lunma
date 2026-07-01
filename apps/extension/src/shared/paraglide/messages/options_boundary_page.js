/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Boundary_PageInputs */

const en_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lock to this page`)
};

const es_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anclar a esta página`)
};

const pt_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloquear a esta página`)
};

const fr_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verrouiller sur cette page`)
};

const de_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An diese Seite binden`)
};

const ja_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このページにロック`)
};

const ko_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 페이지 잠금`)
};

const zh_cn2_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`锁定到此页`)
};

const ru_options_boundary_page = /** @type {(inputs: Options_Boundary_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Привязать к этой странице`)
};

/**
* | output |
* | --- |
* | "Lock to this page" |
*
* @param {Options_Boundary_PageInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_boundary_page = /** @type {((inputs?: Options_Boundary_PageInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Boundary_PageInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_boundary_page(inputs)
	if (locale === "es") return es_options_boundary_page(inputs)
	if (locale === "pt") return pt_options_boundary_page(inputs)
	if (locale === "fr") return fr_options_boundary_page(inputs)
	if (locale === "de") return de_options_boundary_page(inputs)
	if (locale === "ja") return ja_options_boundary_page(inputs)
	if (locale === "ko") return ko_options_boundary_page(inputs)
	if (locale === "zh-CN") return zh_cn2_options_boundary_page(inputs)
	return ru_options_boundary_page(inputs)
});