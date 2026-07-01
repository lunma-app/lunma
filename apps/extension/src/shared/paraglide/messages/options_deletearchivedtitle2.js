/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Deletearchivedtitle2Inputs */

const en_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete`)
};

const es_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const pt_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const de_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Löschen`)
};

const ja_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`削除`)
};

const ko_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`삭제`)
};

const zh_cn2_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`删除`)
};

const ru_options_deletearchivedtitle2 = /** @type {(inputs: Options_Deletearchivedtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Удалить`)
};

/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Options_Deletearchivedtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_deletearchivedtitle2 = /** @type {((inputs?: Options_Deletearchivedtitle2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Deletearchivedtitle2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_deletearchivedtitle2(inputs)
	if (locale === "es") return es_options_deletearchivedtitle2(inputs)
	if (locale === "pt") return pt_options_deletearchivedtitle2(inputs)
	if (locale === "fr") return fr_options_deletearchivedtitle2(inputs)
	if (locale === "de") return de_options_deletearchivedtitle2(inputs)
	if (locale === "ja") return ja_options_deletearchivedtitle2(inputs)
	if (locale === "ko") return ko_options_deletearchivedtitle2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_deletearchivedtitle2(inputs)
	return ru_options_deletearchivedtitle2(inputs)
});
export { options_deletearchivedtitle2 as "options_deleteArchivedTitle" }