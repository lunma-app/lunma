/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Connectionsheading1Inputs */

const en_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connections`)
};

const es_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conexiones`)
};

const pt_pt2_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ligações`)
};

const fr_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexions`)
};

const de_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindungen`)
};

const ja_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`接続`)
};

const ko_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결`)
};

const zh_cn2_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`连接`)
};

const ru_options_connectionsheading1 = /** @type {(inputs: Options_Connectionsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Подключения`)
};

/**
* | output |
* | --- |
* | "Connections" |
*
* @param {Options_Connectionsheading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_connectionsheading1 = /** @type {((inputs?: Options_Connectionsheading1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Connectionsheading1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_connectionsheading1(inputs)
	if (locale === "es") return es_options_connectionsheading1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_connectionsheading1(inputs)
	if (locale === "fr") return fr_options_connectionsheading1(inputs)
	if (locale === "de") return de_options_connectionsheading1(inputs)
	if (locale === "ja") return ja_options_connectionsheading1(inputs)
	if (locale === "ko") return ko_options_connectionsheading1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_connectionsheading1(inputs)
	return ru_options_connectionsheading1(inputs)
});
export { options_connectionsheading1 as "options_connectionsHeading" }