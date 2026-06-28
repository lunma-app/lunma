/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Options_Restorearchivedlabel2Inputs */

const en_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Restore ${i?.title}`)
};

const es_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Restaurar ${i?.title}`)
};

const pt_pt2_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Restaurar ${i?.title}`)
};

const fr_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Restaurer ${i?.title}`)
};

const de_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} wiederherstellen`)
};

const ja_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} を復元`)
};

const ko_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} 복원`)
};

const zh_cn2_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`恢复 ${i?.title}`)
};

const ru_options_restorearchivedlabel2 = /** @type {(inputs: Options_Restorearchivedlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Восстановить ${i?.title}`)
};

/**
* | output |
* | --- |
* | "Restore {title}" |
*
* @param {Options_Restorearchivedlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_restorearchivedlabel2 = /** @type {((inputs: Options_Restorearchivedlabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Restorearchivedlabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_restorearchivedlabel2(inputs)
	if (locale === "es") return es_options_restorearchivedlabel2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_restorearchivedlabel2(inputs)
	if (locale === "fr") return fr_options_restorearchivedlabel2(inputs)
	if (locale === "de") return de_options_restorearchivedlabel2(inputs)
	if (locale === "ja") return ja_options_restorearchivedlabel2(inputs)
	if (locale === "ko") return ko_options_restorearchivedlabel2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_restorearchivedlabel2(inputs)
	return ru_options_restorearchivedlabel2(inputs)
});
export { options_restorearchivedlabel2 as "options_restoreArchivedLabel" }