/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_SaveInputs */

const en_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save`)
};

const es_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar`)
};

const pt_pt2_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar`)
};

const fr_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer`)
};

const de_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichern`)
};

const ja_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`保存`)
};

const ko_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저장`)
};

const zh_cn2_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`保存`)
};

const ru_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Сохранить`)
};

/**
* | output |
* | --- |
* | "Save" |
*
* @param {Common_SaveInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_save = /** @type {((inputs?: Common_SaveInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_SaveInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_save(inputs)
	if (locale === "es") return es_common_save(inputs)
	if (locale === "pt-PT") return pt_pt2_common_save(inputs)
	if (locale === "fr") return fr_common_save(inputs)
	if (locale === "de") return de_common_save(inputs)
	if (locale === "ja") return ja_common_save(inputs)
	if (locale === "ko") return ko_common_save(inputs)
	if (locale === "zh-CN") return zh_cn2_common_save(inputs)
	return ru_common_save(inputs)
});