/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Smartfolderactions2Inputs */

const en_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Smart folder actions`)
};

const es_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acciones de carpeta inteligente`)
};

const pt_pt2_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ações de pasta inteligente`)
};

const fr_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions du dossier intelligent`)
};

const de_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Smart-Ordner-Aktionen`)
};

const ja_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`スマートフォルダーアクション`)
};

const ko_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`스마트 폴더 작업`)
};

const zh_cn2_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`智能文件夹操作`)
};

const ru_sidebar_smartfolderactions2 = /** @type {(inputs: Sidebar_Smartfolderactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Действия со смарт-папкой`)
};

/**
* | output |
* | --- |
* | "Smart folder actions" |
*
* @param {Sidebar_Smartfolderactions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_smartfolderactions2 = /** @type {((inputs?: Sidebar_Smartfolderactions2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Smartfolderactions2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_smartfolderactions2(inputs)
	if (locale === "es") return es_sidebar_smartfolderactions2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_smartfolderactions2(inputs)
	if (locale === "fr") return fr_sidebar_smartfolderactions2(inputs)
	if (locale === "de") return de_sidebar_smartfolderactions2(inputs)
	if (locale === "ja") return ja_sidebar_smartfolderactions2(inputs)
	if (locale === "ko") return ko_sidebar_smartfolderactions2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_smartfolderactions2(inputs)
	return ru_sidebar_smartfolderactions2(inputs)
});
export { sidebar_smartfolderactions2 as "sidebar_smartFolderActions" }