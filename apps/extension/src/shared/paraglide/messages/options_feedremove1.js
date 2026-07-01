/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Feedremove1Inputs */

const en_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove`)
};

const es_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const pt_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remover`)
};

const fr_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const de_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entfernen`)
};

const ja_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`削除`)
};

const ko_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`제거`)
};

const zh_cn2_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`移除`)
};

const ru_options_feedremove1 = /** @type {(inputs: Options_Feedremove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Удалить`)
};

/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Options_Feedremove1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedremove1 = /** @type {((inputs?: Options_Feedremove1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedremove1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_feedremove1(inputs)
	if (locale === "es") return es_options_feedremove1(inputs)
	if (locale === "pt") return pt_options_feedremove1(inputs)
	if (locale === "fr") return fr_options_feedremove1(inputs)
	if (locale === "de") return de_options_feedremove1(inputs)
	if (locale === "ja") return ja_options_feedremove1(inputs)
	if (locale === "ko") return ko_options_feedremove1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_feedremove1(inputs)
	return ru_options_feedremove1(inputs)
});
export { options_feedremove1 as "options_feedRemove" }