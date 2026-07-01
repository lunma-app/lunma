/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Reachnotused2Inputs */

const en_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not used yet`)
};

const es_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no usado`)
};

const pt_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda não utilizado`)
};

const fr_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore utilisé`)
};

const de_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch nicht verwendet`)
};

const ja_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`未使用`)
};

const ko_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아직 사용 안 함`)
};

const zh_cn2_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`尚未使用`)
};

const ru_options_reachnotused2 = /** @type {(inputs: Options_Reachnotused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Пока не используется`)
};

/**
* | output |
* | --- |
* | "Not used yet" |
*
* @param {Options_Reachnotused2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_reachnotused2 = /** @type {((inputs?: Options_Reachnotused2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Reachnotused2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_reachnotused2(inputs)
	if (locale === "es") return es_options_reachnotused2(inputs)
	if (locale === "pt") return pt_options_reachnotused2(inputs)
	if (locale === "fr") return fr_options_reachnotused2(inputs)
	if (locale === "de") return de_options_reachnotused2(inputs)
	if (locale === "ja") return ja_options_reachnotused2(inputs)
	if (locale === "ko") return ko_options_reachnotused2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_reachnotused2(inputs)
	return ru_options_reachnotused2(inputs)
});
export { options_reachnotused2 as "options_reachNotUsed" }