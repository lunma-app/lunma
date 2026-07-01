/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Tempduplicate1Inputs */

const en_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Duplicate`)
};

const es_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Duplicar`)
};

const pt_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Duplicar`)
};

const fr_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dupliquer`)
};

const de_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Duplizieren`)
};

const ja_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`複製`)
};

const ko_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`복제`)
};

const zh_cn2_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`复制`)
};

const ru_sidebar_tempduplicate1 = /** @type {(inputs: Sidebar_Tempduplicate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Дублировать`)
};

/**
* | output |
* | --- |
* | "Duplicate" |
*
* @param {Sidebar_Tempduplicate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tempduplicate1 = /** @type {((inputs?: Sidebar_Tempduplicate1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tempduplicate1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_tempduplicate1(inputs)
	if (locale === "es") return es_sidebar_tempduplicate1(inputs)
	if (locale === "pt") return pt_sidebar_tempduplicate1(inputs)
	if (locale === "fr") return fr_sidebar_tempduplicate1(inputs)
	if (locale === "de") return de_sidebar_tempduplicate1(inputs)
	if (locale === "ja") return ja_sidebar_tempduplicate1(inputs)
	if (locale === "ko") return ko_sidebar_tempduplicate1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_tempduplicate1(inputs)
	return ru_sidebar_tempduplicate1(inputs)
});
export { sidebar_tempduplicate1 as "sidebar_tempDuplicate" }