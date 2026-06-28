/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Accountdisconnect1Inputs */

const en_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disconnect`)
};

const es_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconectar`)
};

const pt_pt2_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desligar`)
};

const fr_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnecter`)
};

const de_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trennen`)
};

const ja_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`切断`)
};

const ko_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 해제`)
};

const zh_cn2_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`断开连接`)
};

const ru_options_accountdisconnect1 = /** @type {(inputs: Options_Accountdisconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Отключить`)
};

/**
* | output |
* | --- |
* | "Disconnect" |
*
* @param {Options_Accountdisconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountdisconnect1 = /** @type {((inputs?: Options_Accountdisconnect1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountdisconnect1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_accountdisconnect1(inputs)
	if (locale === "es") return es_options_accountdisconnect1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_accountdisconnect1(inputs)
	if (locale === "fr") return fr_options_accountdisconnect1(inputs)
	if (locale === "de") return de_options_accountdisconnect1(inputs)
	if (locale === "ja") return ja_options_accountdisconnect1(inputs)
	if (locale === "ko") return ko_options_accountdisconnect1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_accountdisconnect1(inputs)
	return ru_options_accountdisconnect1(inputs)
});
export { options_accountdisconnect1 as "options_accountDisconnect" }