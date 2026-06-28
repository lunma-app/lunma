/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Sidebar_Lensshowread2Inputs */

const en_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Show ${i?.count} read`)
};

const es_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Mostrar ${i?.count} leídas`)
};

const pt_pt2_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Mostrar ${i?.count} lidos`)
};

const fr_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Afficher ${i?.count} lus`)
};

const de_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} gelesene anzeigen`)
};

const ja_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`既読 ${i?.count} 件を表示`)
};

const ko_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`읽은 항목 ${i?.count}개 표시`)
};

const zh_cn2_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`显示 ${i?.count} 条已读`)
};

const ru_sidebar_lensshowread2 = /** @type {(inputs: Sidebar_Lensshowread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Показать ${i?.count} прочитанных`)
};

/**
* | output |
* | --- |
* | "Show {count} read" |
*
* @param {Sidebar_Lensshowread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensshowread2 = /** @type {((inputs: Sidebar_Lensshowread2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensshowread2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensshowread2(inputs)
	if (locale === "es") return es_sidebar_lensshowread2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensshowread2(inputs)
	if (locale === "fr") return fr_sidebar_lensshowread2(inputs)
	if (locale === "de") return de_sidebar_lensshowread2(inputs)
	if (locale === "ja") return ja_sidebar_lensshowread2(inputs)
	if (locale === "ko") return ko_sidebar_lensshowread2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensshowread2(inputs)
	return ru_sidebar_lensshowread2(inputs)
});
export { sidebar_lensshowread2 as "sidebar_lensShowRead" }