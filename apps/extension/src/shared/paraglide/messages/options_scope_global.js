/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Scope_GlobalInputs */

const en_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Spaces`)
};

const es_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos los espacios`)
};

const pt_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos os Espaços`)
};

const fr_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les espaces`)
};

const de_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle Räume`)
};

const ja_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべてのスペース`)
};

const ko_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모든 스페이스`)
};

const zh_cn2_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`所有空间`)
};

const ru_options_scope_global = /** @type {(inputs: Options_Scope_GlobalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Все пространства`)
};

/**
* | output |
* | --- |
* | "All Spaces" |
*
* @param {Options_Scope_GlobalInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_scope_global = /** @type {((inputs?: Options_Scope_GlobalInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Scope_GlobalInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_scope_global(inputs)
	if (locale === "es") return es_options_scope_global(inputs)
	if (locale === "pt") return pt_options_scope_global(inputs)
	if (locale === "fr") return fr_options_scope_global(inputs)
	if (locale === "de") return de_options_scope_global(inputs)
	if (locale === "ja") return ja_options_scope_global(inputs)
	if (locale === "ko") return ko_options_scope_global(inputs)
	if (locale === "zh-CN") return zh_cn2_options_scope_global(inputs)
	return ru_options_scope_global(inputs)
});