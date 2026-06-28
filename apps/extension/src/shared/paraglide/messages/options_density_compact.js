/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Density_CompactInputs */

const en_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compact`)
};

const es_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compacto`)
};

const pt_pt2_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compacto`)
};

const fr_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compact`)
};

const de_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kompakt`)
};

const ja_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`コンパクト`)
};

const ko_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`컴팩트`)
};

const zh_cn2_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`紧凑`)
};

const ru_options_density_compact = /** @type {(inputs: Options_Density_CompactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Компактный`)
};

/**
* | output |
* | --- |
* | "Compact" |
*
* @param {Options_Density_CompactInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_density_compact = /** @type {((inputs?: Options_Density_CompactInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Density_CompactInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_density_compact(inputs)
	if (locale === "es") return es_options_density_compact(inputs)
	if (locale === "pt-PT") return pt_pt2_options_density_compact(inputs)
	if (locale === "fr") return fr_options_density_compact(inputs)
	if (locale === "de") return de_options_density_compact(inputs)
	if (locale === "ja") return ja_options_density_compact(inputs)
	if (locale === "ko") return ko_options_density_compact(inputs)
	if (locale === "zh-CN") return zh_cn2_options_density_compact(inputs)
	return ru_options_density_compact(inputs)
});