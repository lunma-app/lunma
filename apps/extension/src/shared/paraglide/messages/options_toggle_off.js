/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Toggle_OffInputs */

const en_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Off`)
};

const es_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desactivado`)
};

const pt_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desligado`)
};

const fr_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désactivé`)
};

const de_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aus`)
};

const ja_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`オフ`)
};

const ko_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`끄기`)
};

const zh_cn2_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`关闭`)
};

const ru_options_toggle_off = /** @type {(inputs: Options_Toggle_OffInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Выкл.`)
};

/**
* | output |
* | --- |
* | "Off" |
*
* @param {Options_Toggle_OffInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_toggle_off = /** @type {((inputs?: Options_Toggle_OffInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Toggle_OffInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_toggle_off(inputs)
	if (locale === "es") return es_options_toggle_off(inputs)
	if (locale === "pt") return pt_options_toggle_off(inputs)
	if (locale === "fr") return fr_options_toggle_off(inputs)
	if (locale === "de") return de_options_toggle_off(inputs)
	if (locale === "ja") return ja_options_toggle_off(inputs)
	if (locale === "ko") return ko_options_toggle_off(inputs)
	if (locale === "zh-CN") return zh_cn2_options_toggle_off(inputs)
	return ru_options_toggle_off(inputs)
});