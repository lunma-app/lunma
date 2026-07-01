/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Locktositetitle3Inputs */

const en_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lock to its site`)
};

const es_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anclar a su sitio`)
};

const pt_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloquear ao site`)
};

const fr_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verrouiller sur son site`)
};

const de_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An Site binden`)
};

const ja_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`サイトにロック`)
};

const ko_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사이트에 잠금`)
};

const zh_cn2_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`锁定到其站点`)
};

const ru_sidebar_locktositetitle3 = /** @type {(inputs: Sidebar_Locktositetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Привязать к сайту`)
};

/**
* | output |
* | --- |
* | "Lock to its site" |
*
* @param {Sidebar_Locktositetitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_locktositetitle3 = /** @type {((inputs?: Sidebar_Locktositetitle3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Locktositetitle3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_locktositetitle3(inputs)
	if (locale === "es") return es_sidebar_locktositetitle3(inputs)
	if (locale === "pt") return pt_sidebar_locktositetitle3(inputs)
	if (locale === "fr") return fr_sidebar_locktositetitle3(inputs)
	if (locale === "de") return de_sidebar_locktositetitle3(inputs)
	if (locale === "ja") return ja_sidebar_locktositetitle3(inputs)
	if (locale === "ko") return ko_sidebar_locktositetitle3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_locktositetitle3(inputs)
	return ru_sidebar_locktositetitle3(inputs)
});
export { sidebar_locktositetitle3 as "sidebar_lockToSiteTitle" }