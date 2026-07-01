/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Sourceenabled1Inputs */

const en_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enabled`)
};

const es_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activado`)
};

const pt_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ativado`)
};

const fr_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activé`)
};

const de_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktiviert`)
};

const ja_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`有効`)
};

const ko_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`활성화됨`)
};

const zh_cn2_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`已启用`)
};

const ru_options_sourceenabled1 = /** @type {(inputs: Options_Sourceenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Включено`)
};

/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {Options_Sourceenabled1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_sourceenabled1 = /** @type {((inputs?: Options_Sourceenabled1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Sourceenabled1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_sourceenabled1(inputs)
	if (locale === "es") return es_options_sourceenabled1(inputs)
	if (locale === "pt") return pt_options_sourceenabled1(inputs)
	if (locale === "fr") return fr_options_sourceenabled1(inputs)
	if (locale === "de") return de_options_sourceenabled1(inputs)
	if (locale === "ja") return ja_options_sourceenabled1(inputs)
	if (locale === "ko") return ko_options_sourceenabled1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_sourceenabled1(inputs)
	return ru_options_sourceenabled1(inputs)
});
export { options_sourceenabled1 as "options_sourceEnabled" }