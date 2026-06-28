/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Importcancel1Inputs */

const en_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel`)
};

const es_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const pt_pt2_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const fr_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const de_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abbrechen`)
};

const ja_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`キャンセル`)
};

const ko_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취소`)
};

const zh_cn2_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`取消`)
};

const ru_options_importcancel1 = /** @type {(inputs: Options_Importcancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Отмена`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Options_Importcancel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importcancel1 = /** @type {((inputs?: Options_Importcancel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importcancel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_importcancel1(inputs)
	if (locale === "es") return es_options_importcancel1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_importcancel1(inputs)
	if (locale === "fr") return fr_options_importcancel1(inputs)
	if (locale === "de") return de_options_importcancel1(inputs)
	if (locale === "ja") return ja_options_importcancel1(inputs)
	if (locale === "ko") return ko_options_importcancel1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_importcancel1(inputs)
	return ru_options_importcancel1(inputs)
});
export { options_importcancel1 as "options_importCancel" }