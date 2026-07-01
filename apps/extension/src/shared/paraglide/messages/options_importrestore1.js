/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Importrestore1Inputs */

const en_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restore`)
};

const es_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurar`)
};

const pt_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurar`)
};

const fr_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurer`)
};

const de_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wiederherstellen`)
};

const ja_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`復元`)
};

const ko_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`복원`)
};

const zh_cn2_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`恢复`)
};

const ru_options_importrestore1 = /** @type {(inputs: Options_Importrestore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Восстановить`)
};

/**
* | output |
* | --- |
* | "Restore" |
*
* @param {Options_Importrestore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importrestore1 = /** @type {((inputs?: Options_Importrestore1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importrestore1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_importrestore1(inputs)
	if (locale === "es") return es_options_importrestore1(inputs)
	if (locale === "pt") return pt_options_importrestore1(inputs)
	if (locale === "fr") return fr_options_importrestore1(inputs)
	if (locale === "de") return de_options_importrestore1(inputs)
	if (locale === "ja") return ja_options_importrestore1(inputs)
	if (locale === "ko") return ko_options_importrestore1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_importrestore1(inputs)
	return ru_options_importrestore1(inputs)
});
export { options_importrestore1 as "options_importRestore" }