/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Selectall1Inputs */

const en_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select all`)
};

const es_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar todo`)
};

const pt_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecionar tudo`)
};

const fr_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout sélectionner`)
};

const de_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle auswählen`)
};

const ja_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべて選択`)
};

const ko_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 선택`)
};

const zh_cn2_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`全选`)
};

const ru_common_selectall1 = /** @type {(inputs: Common_Selectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Выбрать все`)
};

/**
* | output |
* | --- |
* | "Select all" |
*
* @param {Common_Selectall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const common_selectall1 = /** @type {((inputs?: Common_Selectall1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Selectall1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_selectall1(inputs)
	if (locale === "es") return es_common_selectall1(inputs)
	if (locale === "pt") return pt_common_selectall1(inputs)
	if (locale === "fr") return fr_common_selectall1(inputs)
	if (locale === "de") return de_common_selectall1(inputs)
	if (locale === "ja") return ja_common_selectall1(inputs)
	if (locale === "ko") return ko_common_selectall1(inputs)
	if (locale === "zh-CN") return zh_cn2_common_selectall1(inputs)
	return ru_common_selectall1(inputs)
});
export { common_selectall1 as "common_selectAll" }