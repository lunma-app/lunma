/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Cleararchived1Inputs */

const en_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clear all`)
};

const es_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borrar todo`)
};

const pt_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Limpar tudo`)
};

const fr_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout effacer`)
};

const de_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle löschen`)
};

const ja_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべてクリア`)
};

const ko_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 지우기`)
};

const zh_cn2_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`全部清除`)
};

const ru_options_cleararchived1 = /** @type {(inputs: Options_Cleararchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Очистить всё`)
};

/**
* | output |
* | --- |
* | "Clear all" |
*
* @param {Options_Cleararchived1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_cleararchived1 = /** @type {((inputs?: Options_Cleararchived1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Cleararchived1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_cleararchived1(inputs)
	if (locale === "es") return es_options_cleararchived1(inputs)
	if (locale === "pt") return pt_options_cleararchived1(inputs)
	if (locale === "fr") return fr_options_cleararchived1(inputs)
	if (locale === "de") return de_options_cleararchived1(inputs)
	if (locale === "ja") return ja_options_cleararchived1(inputs)
	if (locale === "ko") return ko_options_cleararchived1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_cleararchived1(inputs)
	return ru_options_cleararchived1(inputs)
});
export { options_cleararchived1 as "options_clearArchived" }