/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Engine_CustomInputs */

const en_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom`)
};

const es_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizado`)
};

const pt_pt2_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizado`)
};

const fr_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisé`)
};

const de_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benutzerdefiniert`)
};

const ja_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`カスタム`)
};

const ko_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사용자 정의`)
};

const zh_cn2_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自定义`)
};

const ru_options_engine_custom = /** @type {(inputs: Options_Engine_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Произвольный`)
};

/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Options_Engine_CustomInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_engine_custom = /** @type {((inputs?: Options_Engine_CustomInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Engine_CustomInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_engine_custom(inputs)
	if (locale === "es") return es_options_engine_custom(inputs)
	if (locale === "pt-PT") return pt_pt2_options_engine_custom(inputs)
	if (locale === "fr") return fr_options_engine_custom(inputs)
	if (locale === "de") return de_options_engine_custom(inputs)
	if (locale === "ja") return ja_options_engine_custom(inputs)
	if (locale === "ko") return ko_options_engine_custom(inputs)
	if (locale === "zh-CN") return zh_cn2_options_engine_custom(inputs)
	return ru_options_engine_custom(inputs)
});