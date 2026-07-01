/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Accountsgrouptitle2Inputs */

const en_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accounts`)
};

const es_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuentas`)
};

const pt_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contas`)
};

const fr_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comptes`)
};

const de_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Konten`)
};

const ja_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アカウント`)
};

const ko_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정`)
};

const zh_cn2_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`账户`)
};

const ru_options_accountsgrouptitle2 = /** @type {(inputs: Options_Accountsgrouptitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Аккаунты`)
};

/**
* | output |
* | --- |
* | "Accounts" |
*
* @param {Options_Accountsgrouptitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountsgrouptitle2 = /** @type {((inputs?: Options_Accountsgrouptitle2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountsgrouptitle2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_accountsgrouptitle2(inputs)
	if (locale === "es") return es_options_accountsgrouptitle2(inputs)
	if (locale === "pt") return pt_options_accountsgrouptitle2(inputs)
	if (locale === "fr") return fr_options_accountsgrouptitle2(inputs)
	if (locale === "de") return de_options_accountsgrouptitle2(inputs)
	if (locale === "ja") return ja_options_accountsgrouptitle2(inputs)
	if (locale === "ko") return ko_options_accountsgrouptitle2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_accountsgrouptitle2(inputs)
	return ru_options_accountsgrouptitle2(inputs)
});
export { options_accountsgrouptitle2 as "options_accountsGroupTitle" }