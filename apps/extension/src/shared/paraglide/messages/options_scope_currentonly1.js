/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Scope_Currentonly1Inputs */

const en_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Current Space only`)
};

const es_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo espacio actual`)
};

const pt_pt2_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apenas Space atual`)
};

const fr_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Espace actuel uniquement`)
};

const de_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nur aktueller Space`)
};

const ja_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`現在のスペースのみ`)
};

const ko_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`현재 스페이스만`)
};

const zh_cn2_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`仅当前空间`)
};

const ru_options_scope_currentonly1 = /** @type {(inputs: Options_Scope_Currentonly1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Только текущее`)
};

/**
* | output |
* | --- |
* | "Current Space only" |
*
* @param {Options_Scope_Currentonly1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_scope_currentonly1 = /** @type {((inputs?: Options_Scope_Currentonly1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Scope_Currentonly1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_scope_currentonly1(inputs)
	if (locale === "es") return es_options_scope_currentonly1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_scope_currentonly1(inputs)
	if (locale === "fr") return fr_options_scope_currentonly1(inputs)
	if (locale === "de") return de_options_scope_currentonly1(inputs)
	if (locale === "ja") return ja_options_scope_currentonly1(inputs)
	if (locale === "ko") return ko_options_scope_currentonly1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_scope_currentonly1(inputs)
	return ru_options_scope_currentonly1(inputs)
});
export { options_scope_currentonly1 as "options_scope_currentOnly" }