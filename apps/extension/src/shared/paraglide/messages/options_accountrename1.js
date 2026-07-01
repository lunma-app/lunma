/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Accountrename1Inputs */

const en_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rename`)
};

const es_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renombrar`)
};

const pt_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renomear`)
};

const fr_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renommer`)
};

const de_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Umbenennen`)
};

const ja_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`名前を変更`)
};

const ko_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이름 변경`)
};

const zh_cn2_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`重命名`)
};

const ru_options_accountrename1 = /** @type {(inputs: Options_Accountrename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Переименовать`)
};

/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Options_Accountrename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountrename1 = /** @type {((inputs?: Options_Accountrename1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountrename1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_accountrename1(inputs)
	if (locale === "es") return es_options_accountrename1(inputs)
	if (locale === "pt") return pt_options_accountrename1(inputs)
	if (locale === "fr") return fr_options_accountrename1(inputs)
	if (locale === "de") return de_options_accountrename1(inputs)
	if (locale === "ja") return ja_options_accountrename1(inputs)
	if (locale === "ko") return ko_options_accountrename1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_accountrename1(inputs)
	return ru_options_accountrename1(inputs)
});
export { options_accountrename1 as "options_accountRename" }