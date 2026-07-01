/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Tabactions1Inputs */

const en_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab actions`)
};

const es_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acciones de pestaña`)
};

const pt_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ações do separador`)
};

const fr_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions de l'onglet`)
};

const de_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab-Aktionen`)
};

const ja_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`タブアクション`)
};

const ko_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭 작업`)
};

const zh_cn2_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`标签页操作`)
};

const ru_sidebar_tabactions1 = /** @type {(inputs: Sidebar_Tabactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Действия с вкладкой`)
};

/**
* | output |
* | --- |
* | "Tab actions" |
*
* @param {Sidebar_Tabactions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabactions1 = /** @type {((inputs?: Sidebar_Tabactions1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabactions1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_tabactions1(inputs)
	if (locale === "es") return es_sidebar_tabactions1(inputs)
	if (locale === "pt") return pt_sidebar_tabactions1(inputs)
	if (locale === "fr") return fr_sidebar_tabactions1(inputs)
	if (locale === "de") return de_sidebar_tabactions1(inputs)
	if (locale === "ja") return ja_sidebar_tabactions1(inputs)
	if (locale === "ko") return ko_sidebar_tabactions1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_tabactions1(inputs)
	return ru_sidebar_tabactions1(inputs)
});
export { sidebar_tabactions1 as "sidebar_tabActions" }