/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Includesettingslabel2Inputs */

const en_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Include settings`)
};

const es_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incluir ajustes`)
};

const pt_pt2_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incluir definições`)
};

const fr_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inclure les paramètres`)
};

const de_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einstellungen einschließen`)
};

const ja_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`設定を含める`)
};

const ko_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`설정 포함`)
};

const zh_cn2_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`包含设置`)
};

const ru_options_includesettingslabel2 = /** @type {(inputs: Options_Includesettingslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Включить настройки`)
};

/**
* | output |
* | --- |
* | "Include settings" |
*
* @param {Options_Includesettingslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_includesettingslabel2 = /** @type {((inputs?: Options_Includesettingslabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Includesettingslabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_includesettingslabel2(inputs)
	if (locale === "es") return es_options_includesettingslabel2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_includesettingslabel2(inputs)
	if (locale === "fr") return fr_options_includesettingslabel2(inputs)
	if (locale === "de") return de_options_includesettingslabel2(inputs)
	if (locale === "ja") return ja_options_includesettingslabel2(inputs)
	if (locale === "ko") return ko_options_includesettingslabel2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_includesettingslabel2(inputs)
	return ru_options_includesettingslabel2(inputs)
});
export { options_includesettingslabel2 as "options_includeSettingsLabel" }