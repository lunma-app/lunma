/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensnoentriesyet3Inputs */

const en_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No entries yet.`)
};

const es_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay entradas.`)
};

const pt_pt2_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda sem entradas.`)
};

const fr_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune entrée pour l'instant.`)
};

const de_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Einträge.`)
};

const ja_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`まだエントリーがありません。`)
};

const ko_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`항목이 없습니다.`)
};

const zh_cn2_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`暂无内容`)
};

const ru_sidebar_lensnoentriesyet3 = /** @type {(inputs: Sidebar_Lensnoentriesyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Записей пока нет.`)
};

/**
* | output |
* | --- |
* | "No entries yet." |
*
* @param {Sidebar_Lensnoentriesyet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensnoentriesyet3 = /** @type {((inputs?: Sidebar_Lensnoentriesyet3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensnoentriesyet3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensnoentriesyet3(inputs)
	if (locale === "es") return es_sidebar_lensnoentriesyet3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensnoentriesyet3(inputs)
	if (locale === "fr") return fr_sidebar_lensnoentriesyet3(inputs)
	if (locale === "de") return de_sidebar_lensnoentriesyet3(inputs)
	if (locale === "ja") return ja_sidebar_lensnoentriesyet3(inputs)
	if (locale === "ko") return ko_sidebar_lensnoentriesyet3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensnoentriesyet3(inputs)
	return ru_sidebar_lensnoentriesyet3(inputs)
});
export { sidebar_lensnoentriesyet3 as "sidebar_lensNoEntriesYet" }