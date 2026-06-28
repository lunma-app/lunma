/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Grouplabel_Autoarchive2Inputs */

const en_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-archive`)
};

const es_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo automático`)
};

const pt_pt2_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arquivo automático`)
};

const fr_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivage auto`)
};

const de_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatisch archivieren`)
};

const ja_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自動アーカイブ`)
};

const ko_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자동 보관`)
};

const zh_cn2_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自动归档`)
};

const ru_options_grouplabel_autoarchive2 = /** @type {(inputs: Options_Grouplabel_Autoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Авто-архивирование`)
};

/**
* | output |
* | --- |
* | "Auto-archive" |
*
* @param {Options_Grouplabel_Autoarchive2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_grouplabel_autoarchive2 = /** @type {((inputs?: Options_Grouplabel_Autoarchive2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Grouplabel_Autoarchive2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_grouplabel_autoarchive2(inputs)
	if (locale === "es") return es_options_grouplabel_autoarchive2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_grouplabel_autoarchive2(inputs)
	if (locale === "fr") return fr_options_grouplabel_autoarchive2(inputs)
	if (locale === "de") return de_options_grouplabel_autoarchive2(inputs)
	if (locale === "ja") return ja_options_grouplabel_autoarchive2(inputs)
	if (locale === "ko") return ko_options_grouplabel_autoarchive2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_grouplabel_autoarchive2(inputs)
	return ru_options_grouplabel_autoarchive2(inputs)
});
export { options_grouplabel_autoarchive2 as "options_groupLabel_autoArchive" }