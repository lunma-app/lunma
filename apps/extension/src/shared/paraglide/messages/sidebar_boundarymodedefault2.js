/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Boundarymodedefault2Inputs */

const en_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Default`)
};

const es_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Predeterminado`)
};

const pt_pt2_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Predefinição`)
};

const fr_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Par défaut`)
};

const de_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const ja_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`デフォルト`)
};

const ko_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기본값`)
};

const zh_cn2_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`默认`)
};

const ru_sidebar_boundarymodedefault2 = /** @type {(inputs: Sidebar_Boundarymodedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`По умолчанию`)
};

/**
* | output |
* | --- |
* | "Default" |
*
* @param {Sidebar_Boundarymodedefault2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarymodedefault2 = /** @type {((inputs?: Sidebar_Boundarymodedefault2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarymodedefault2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_boundarymodedefault2(inputs)
	if (locale === "es") return es_sidebar_boundarymodedefault2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_boundarymodedefault2(inputs)
	if (locale === "fr") return fr_sidebar_boundarymodedefault2(inputs)
	if (locale === "de") return de_sidebar_boundarymodedefault2(inputs)
	if (locale === "ja") return ja_sidebar_boundarymodedefault2(inputs)
	if (locale === "ko") return ko_sidebar_boundarymodedefault2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_boundarymodedefault2(inputs)
	return ru_sidebar_boundarymodedefault2(inputs)
});
export { sidebar_boundarymodedefault2 as "sidebar_boundaryModeDefault" }