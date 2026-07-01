/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Connecttoggleclose2Inputs */

const en_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar`)
};

const pt_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fechar`)
};

const fr_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const de_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schließen`)
};

const ja_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`閉じる`)
};

const ko_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`닫기`)
};

const zh_cn2_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`关闭`)
};

const ru_options_connecttoggleclose2 = /** @type {(inputs: Options_Connecttoggleclose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Закрыть`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Options_Connecttoggleclose2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_connecttoggleclose2 = /** @type {((inputs?: Options_Connecttoggleclose2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Connecttoggleclose2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_connecttoggleclose2(inputs)
	if (locale === "es") return es_options_connecttoggleclose2(inputs)
	if (locale === "pt") return pt_options_connecttoggleclose2(inputs)
	if (locale === "fr") return fr_options_connecttoggleclose2(inputs)
	if (locale === "de") return de_options_connecttoggleclose2(inputs)
	if (locale === "ja") return ja_options_connecttoggleclose2(inputs)
	if (locale === "ko") return ko_options_connecttoggleclose2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_connecttoggleclose2(inputs)
	return ru_options_connecttoggleclose2(inputs)
});
export { options_connecttoggleclose2 as "options_connectToggleClose" }