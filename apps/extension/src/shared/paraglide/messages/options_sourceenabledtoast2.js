/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ label: NonNullable<unknown> }} Options_Sourceenabledtoast2Inputs */

const en_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.label} enabled`)
};

const es_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.label} activado`)
};

const pt_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.label} ativado`)
};

const fr_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.label} activé`)
};

const de_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.label} aktiviert`)
};

const ja_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.label} を有効にしました`)
};

const ko_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.label} 활성화됨`)
};

const zh_cn2_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`已启用 ${i?.label}`)
};

const ru_options_sourceenabledtoast2 = /** @type {(inputs: Options_Sourceenabledtoast2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.label} включено`)
};

/**
* | output |
* | --- |
* | "{label} enabled" |
*
* @param {Options_Sourceenabledtoast2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_sourceenabledtoast2 = /** @type {((inputs: Options_Sourceenabledtoast2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Sourceenabledtoast2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_sourceenabledtoast2(inputs)
	if (locale === "es") return es_options_sourceenabledtoast2(inputs)
	if (locale === "pt") return pt_options_sourceenabledtoast2(inputs)
	if (locale === "fr") return fr_options_sourceenabledtoast2(inputs)
	if (locale === "de") return de_options_sourceenabledtoast2(inputs)
	if (locale === "ja") return ja_options_sourceenabledtoast2(inputs)
	if (locale === "ko") return ko_options_sourceenabledtoast2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_sourceenabledtoast2(inputs)
	return ru_options_sourceenabledtoast2(inputs)
});
export { options_sourceenabledtoast2 as "options_sourceEnabledToast" }