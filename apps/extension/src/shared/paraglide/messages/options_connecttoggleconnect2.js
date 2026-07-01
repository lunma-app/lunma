/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Connecttoggleconnect2Inputs */

const en_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Connect`)
};

const es_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Conectar`)
};

const pt_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Ligar`)
};

const fr_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Connecter`)
};

const de_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Verbinden`)
};

const ja_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ 接続`)
};

const ko_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ 연결`)
};

const zh_cn2_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ 连接`)
};

const ru_options_connecttoggleconnect2 = /** @type {(inputs: Options_Connecttoggleconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Подключить`)
};

/**
* | output |
* | --- |
* | "+ Connect" |
*
* @param {Options_Connecttoggleconnect2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_connecttoggleconnect2 = /** @type {((inputs?: Options_Connecttoggleconnect2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Connecttoggleconnect2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_connecttoggleconnect2(inputs)
	if (locale === "es") return es_options_connecttoggleconnect2(inputs)
	if (locale === "pt") return pt_options_connecttoggleconnect2(inputs)
	if (locale === "fr") return fr_options_connecttoggleconnect2(inputs)
	if (locale === "de") return de_options_connecttoggleconnect2(inputs)
	if (locale === "ja") return ja_options_connecttoggleconnect2(inputs)
	if (locale === "ko") return ko_options_connecttoggleconnect2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_connecttoggleconnect2(inputs)
	return ru_options_connecttoggleconnect2(inputs)
});
export { options_connecttoggleconnect2 as "options_connectToggleConnect" }