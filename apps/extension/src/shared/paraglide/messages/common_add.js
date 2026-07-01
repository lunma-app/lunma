/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_AddInputs */

const en_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add`)
};

const es_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir`)
};

const pt_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adicionar`)
};

const fr_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter`)
};

const de_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hinzufügen`)
};

const ja_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`追加`)
};

const ko_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`추가`)
};

const zh_cn2_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`添加`)
};

const ru_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Добавить`)
};

/**
* | output |
* | --- |
* | "Add" |
*
* @param {Common_AddInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_add = /** @type {((inputs?: Common_AddInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_AddInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_add(inputs)
	if (locale === "es") return es_common_add(inputs)
	if (locale === "pt") return pt_common_add(inputs)
	if (locale === "fr") return fr_common_add(inputs)
	if (locale === "de") return de_common_add(inputs)
	if (locale === "ja") return ja_common_add(inputs)
	if (locale === "ko") return ko_common_add(inputs)
	if (locale === "zh-CN") return zh_cn2_common_add(inputs)
	return ru_common_add(inputs)
});