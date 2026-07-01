/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_ManageInputs */

const en_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage`)
};

const es_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar`)
};

const pt_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gerir`)
};

const fr_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer`)
};

const de_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verwalten`)
};

const ja_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`管理`)
};

const ko_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`관리`)
};

const zh_cn2_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`管理`)
};

const ru_common_manage = /** @type {(inputs: Common_ManageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Управление`)
};

/**
* | output |
* | --- |
* | "Manage" |
*
* @param {Common_ManageInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_manage = /** @type {((inputs?: Common_ManageInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ManageInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_manage(inputs)
	if (locale === "es") return es_common_manage(inputs)
	if (locale === "pt") return pt_common_manage(inputs)
	if (locale === "fr") return fr_common_manage(inputs)
	if (locale === "de") return de_common_manage(inputs)
	if (locale === "ja") return ja_common_manage(inputs)
	if (locale === "ko") return ko_common_manage(inputs)
	if (locale === "zh-CN") return zh_cn2_common_manage(inputs)
	return ru_common_manage(inputs)
});