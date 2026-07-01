/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_NameInputs */

const en_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const es_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre`)
};

const pt_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nome`)
};

const fr_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom`)
};

const de_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const ja_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`名前`)
};

const ko_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이름`)
};

const zh_cn2_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`名称`)
};

const ru_common_name = /** @type {(inputs: Common_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Название`)
};

/**
* | output |
* | --- |
* | "Name" |
*
* @param {Common_NameInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_name = /** @type {((inputs?: Common_NameInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_NameInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_name(inputs)
	if (locale === "es") return es_common_name(inputs)
	if (locale === "pt") return pt_common_name(inputs)
	if (locale === "fr") return fr_common_name(inputs)
	if (locale === "de") return de_common_name(inputs)
	if (locale === "ja") return ja_common_name(inputs)
	if (locale === "ko") return ko_common_name(inputs)
	if (locale === "zh-CN") return zh_cn2_common_name(inputs)
	return ru_common_name(inputs)
});