/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensedit1Inputs */

const en_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit…`)
};

const es_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar…`)
};

const pt_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar…`)
};

const fr_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier…`)
};

const de_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bearbeiten…`)
};

const ja_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`編集…`)
};

const ko_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`편집…`)
};

const zh_cn2_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`编辑…`)
};

const ru_sidebar_lensedit1 = /** @type {(inputs: Sidebar_Lensedit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Изменить…`)
};

/**
* | output |
* | --- |
* | "Edit…" |
*
* @param {Sidebar_Lensedit1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensedit1 = /** @type {((inputs?: Sidebar_Lensedit1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensedit1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensedit1(inputs)
	if (locale === "es") return es_sidebar_lensedit1(inputs)
	if (locale === "pt") return pt_sidebar_lensedit1(inputs)
	if (locale === "fr") return fr_sidebar_lensedit1(inputs)
	if (locale === "de") return de_sidebar_lensedit1(inputs)
	if (locale === "ja") return ja_sidebar_lensedit1(inputs)
	if (locale === "ko") return ko_sidebar_lensedit1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensedit1(inputs)
	return ru_sidebar_lensedit1(inputs)
});
export { sidebar_lensedit1 as "sidebar_lensEdit" }