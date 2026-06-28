/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Tablocktosite3Inputs */

const en_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lock to its site…`)
};

const es_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anclar a su sitio…`)
};

const pt_pt2_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloquear ao site…`)
};

const fr_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verrouiller sur son site…`)
};

const de_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An Site binden…`)
};

const ja_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`サイトにロック…`)
};

const ko_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사이트에 잠금…`)
};

const zh_cn2_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`锁定到其站点…`)
};

const ru_sidebar_tablocktosite3 = /** @type {(inputs: Sidebar_Tablocktosite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Привязать к сайту…`)
};

/**
* | output |
* | --- |
* | "Lock to its site…" |
*
* @param {Sidebar_Tablocktosite3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tablocktosite3 = /** @type {((inputs?: Sidebar_Tablocktosite3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tablocktosite3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_tablocktosite3(inputs)
	if (locale === "es") return es_sidebar_tablocktosite3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_tablocktosite3(inputs)
	if (locale === "fr") return fr_sidebar_tablocktosite3(inputs)
	if (locale === "de") return de_sidebar_tablocktosite3(inputs)
	if (locale === "ja") return ja_sidebar_tablocktosite3(inputs)
	if (locale === "ko") return ko_sidebar_tablocktosite3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_tablocktosite3(inputs)
	return ru_sidebar_tablocktosite3(inputs)
});
export { sidebar_tablocktosite3 as "sidebar_tabLockToSite" }