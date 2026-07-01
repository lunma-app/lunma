/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Density_ComfortInputs */

const en_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comfort`)
};

const es_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómodo`)
};

const pt_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confortável`)
};

const fr_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confort`)
};

const de_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Komfort`)
};

const ja_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ゆとり`)
};

const ko_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`넓게`)
};

const zh_cn2_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`舒适`)
};

const ru_options_density_comfort = /** @type {(inputs: Options_Density_ComfortInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Просторный`)
};

/**
* | output |
* | --- |
* | "Comfort" |
*
* @param {Options_Density_ComfortInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_density_comfort = /** @type {((inputs?: Options_Density_ComfortInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Density_ComfortInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_density_comfort(inputs)
	if (locale === "es") return es_options_density_comfort(inputs)
	if (locale === "pt") return pt_options_density_comfort(inputs)
	if (locale === "fr") return fr_options_density_comfort(inputs)
	if (locale === "de") return de_options_density_comfort(inputs)
	if (locale === "ja") return ja_options_density_comfort(inputs)
	if (locale === "ko") return ko_options_density_comfort(inputs)
	if (locale === "zh-CN") return zh_cn2_options_density_comfort(inputs)
	return ru_options_density_comfort(inputs)
});