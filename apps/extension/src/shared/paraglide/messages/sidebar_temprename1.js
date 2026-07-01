/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Temprename1Inputs */

const en_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rename`)
};

const es_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renombrar`)
};

const pt_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renomear`)
};

const fr_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renommer`)
};

const de_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Umbenennen`)
};

const ja_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`名前を変更`)
};

const ko_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이름 변경`)
};

const zh_cn2_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`重命名`)
};

const ru_sidebar_temprename1 = /** @type {(inputs: Sidebar_Temprename1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Переименовать`)
};

/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Sidebar_Temprename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_temprename1 = /** @type {((inputs?: Sidebar_Temprename1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Temprename1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_temprename1(inputs)
	if (locale === "es") return es_sidebar_temprename1(inputs)
	if (locale === "pt") return pt_sidebar_temprename1(inputs)
	if (locale === "fr") return fr_sidebar_temprename1(inputs)
	if (locale === "de") return de_sidebar_temprename1(inputs)
	if (locale === "ja") return ja_sidebar_temprename1(inputs)
	if (locale === "ko") return ko_sidebar_temprename1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_temprename1(inputs)
	return ru_sidebar_temprename1(inputs)
});
export { sidebar_temprename1 as "sidebar_tempRename" }