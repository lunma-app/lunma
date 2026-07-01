/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Toggle_OnInputs */

const en_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On`)
};

const es_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activado`)
};

const pt_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ligado`)
};

const fr_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activé`)
};

const de_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An`)
};

const ja_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`オン`)
};

const ko_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`켜기`)
};

const zh_cn2_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`开启`)
};

const ru_options_toggle_on = /** @type {(inputs: Options_Toggle_OnInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Вкл.`)
};

/**
* | output |
* | --- |
* | "On" |
*
* @param {Options_Toggle_OnInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_toggle_on = /** @type {((inputs?: Options_Toggle_OnInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Toggle_OnInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_toggle_on(inputs)
	if (locale === "es") return es_options_toggle_on(inputs)
	if (locale === "pt") return pt_options_toggle_on(inputs)
	if (locale === "fr") return fr_options_toggle_on(inputs)
	if (locale === "de") return de_options_toggle_on(inputs)
	if (locale === "ja") return ja_options_toggle_on(inputs)
	if (locale === "ko") return ko_options_toggle_on(inputs)
	if (locale === "zh-CN") return zh_cn2_options_toggle_on(inputs)
	return ru_options_toggle_on(inputs)
});