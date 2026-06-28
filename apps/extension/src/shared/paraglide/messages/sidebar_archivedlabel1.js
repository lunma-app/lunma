/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Sidebar_Archivedlabel1Inputs */

const en_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Recently archived (${i?.count})`)
};

const es_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Archivado recientemente (${i?.count})`)
};

const pt_pt2_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Arquivado recentemente (${i?.count})`)
};

const fr_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Récemment archivé (${i?.count})`)
};

const de_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Kürzlich archiviert (${i?.count})`)
};

const ja_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`最近アーカイブ (${i?.count})`)
};

const ko_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`최근 보관됨 (${i?.count})`)
};

const zh_cn2_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`最近已归档（${i?.count}）`)
};

const ru_sidebar_archivedlabel1 = /** @type {(inputs: Sidebar_Archivedlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Недавно архивировано (${i?.count})`)
};

/**
* | output |
* | --- |
* | "Recently archived ({count})" |
*
* @param {Sidebar_Archivedlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_archivedlabel1 = /** @type {((inputs: Sidebar_Archivedlabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Archivedlabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_archivedlabel1(inputs)
	if (locale === "es") return es_sidebar_archivedlabel1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_archivedlabel1(inputs)
	if (locale === "fr") return fr_sidebar_archivedlabel1(inputs)
	if (locale === "de") return de_sidebar_archivedlabel1(inputs)
	if (locale === "ja") return ja_sidebar_archivedlabel1(inputs)
	if (locale === "ko") return ko_sidebar_archivedlabel1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_archivedlabel1(inputs)
	return ru_sidebar_archivedlabel1(inputs)
});
export { sidebar_archivedlabel1 as "sidebar_archivedLabel" }