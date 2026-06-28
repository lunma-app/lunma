/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ version: NonNullable<unknown> }} Options_VersionInputs */

const en_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

const es_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

const pt_pt2_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

const fr_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

const de_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

const ja_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

const ko_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

const zh_cn2_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

const ru_options_version = /** @type {(inputs: Options_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`v${i?.version}`)
};

/**
* | output |
* | --- |
* | "v{version}" |
*
* @param {Options_VersionInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_version = /** @type {((inputs: Options_VersionInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_VersionInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_version(inputs)
	if (locale === "es") return es_options_version(inputs)
	if (locale === "pt-PT") return pt_pt2_options_version(inputs)
	if (locale === "fr") return fr_options_version(inputs)
	if (locale === "de") return de_options_version(inputs)
	if (locale === "ja") return ja_options_version(inputs)
	if (locale === "ko") return ko_options_version(inputs)
	if (locale === "zh-CN") return zh_cn2_options_version(inputs)
	return ru_options_version(inputs)
});