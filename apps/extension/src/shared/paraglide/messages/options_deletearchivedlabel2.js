/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Options_Deletearchivedlabel2Inputs */

const en_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Delete ${i?.title}`)
};

const es_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Eliminar ${i?.title}`)
};

const pt_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Eliminar ${i?.title}`)
};

const fr_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Supprimer ${i?.title}`)
};

const de_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} löschen`)
};

const ja_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} を削除`)
};

const ko_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} 삭제`)
};

const zh_cn2_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`删除 ${i?.title}`)
};

const ru_options_deletearchivedlabel2 = /** @type {(inputs: Options_Deletearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Удалить ${i?.title}`)
};

/**
* | output |
* | --- |
* | "Delete {title}" |
*
* @param {Options_Deletearchivedlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_deletearchivedlabel2 = /** @type {((inputs: Options_Deletearchivedlabel2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Deletearchivedlabel2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_deletearchivedlabel2(inputs)
	if (locale === "es") return es_options_deletearchivedlabel2(inputs)
	if (locale === "pt") return pt_options_deletearchivedlabel2(inputs)
	if (locale === "fr") return fr_options_deletearchivedlabel2(inputs)
	if (locale === "de") return de_options_deletearchivedlabel2(inputs)
	if (locale === "ja") return ja_options_deletearchivedlabel2(inputs)
	if (locale === "ko") return ko_options_deletearchivedlabel2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_deletearchivedlabel2(inputs)
	return ru_options_deletearchivedlabel2(inputs)
});
export { options_deletearchivedlabel2 as "options_deleteArchivedLabel" }