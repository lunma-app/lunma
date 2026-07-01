/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Autoarchivemanage2Inputs */

const en_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage in settings`)
};

const es_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar en ajustes`)
};

const pt_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gerir nas definições`)
};

const fr_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer dans les paramètres`)
};

const de_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In Einstellungen verwalten`)
};

const ja_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`設定で管理`)
};

const ko_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`설정에서 관리`)
};

const zh_cn2_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`在设置中管理`)
};

const ru_sidebar_autoarchivemanage2 = /** @type {(inputs: Sidebar_Autoarchivemanage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Управление в настройках`)
};

/**
* | output |
* | --- |
* | "Manage in settings" |
*
* @param {Sidebar_Autoarchivemanage2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivemanage2 = /** @type {((inputs?: Sidebar_Autoarchivemanage2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivemanage2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchivemanage2(inputs)
	if (locale === "es") return es_sidebar_autoarchivemanage2(inputs)
	if (locale === "pt") return pt_sidebar_autoarchivemanage2(inputs)
	if (locale === "fr") return fr_sidebar_autoarchivemanage2(inputs)
	if (locale === "de") return de_sidebar_autoarchivemanage2(inputs)
	if (locale === "ja") return ja_sidebar_autoarchivemanage2(inputs)
	if (locale === "ko") return ko_sidebar_autoarchivemanage2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchivemanage2(inputs)
	return ru_sidebar_autoarchivemanage2(inputs)
});
export { sidebar_autoarchivemanage2 as "sidebar_autoArchiveManage" }