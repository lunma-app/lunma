/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Sidebar_Lenshideread2Inputs */

const en_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Hide ${i?.count} read`)
};

const es_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ocultar ${i?.count} leídas`)
};

const pt_pt2_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ocultar ${i?.count} lidos`)
};

const fr_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Masquer ${i?.count} lus`)
};

const de_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} gelesene ausblenden`)
};

const ja_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`既読 ${i?.count} 件を非表示`)
};

const ko_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`읽은 항목 ${i?.count}개 숨기기`)
};

const zh_cn2_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`隐藏 ${i?.count} 条已读`)
};

const ru_sidebar_lenshideread2 = /** @type {(inputs: Sidebar_Lenshideread2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Скрыть ${i?.count} прочитанных`)
};

/**
* | output |
* | --- |
* | "Hide {count} read" |
*
* @param {Sidebar_Lenshideread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenshideread2 = /** @type {((inputs: Sidebar_Lenshideread2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenshideread2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenshideread2(inputs)
	if (locale === "es") return es_sidebar_lenshideread2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lenshideread2(inputs)
	if (locale === "fr") return fr_sidebar_lenshideread2(inputs)
	if (locale === "de") return de_sidebar_lenshideread2(inputs)
	if (locale === "ja") return ja_sidebar_lenshideread2(inputs)
	if (locale === "ko") return ko_sidebar_lenshideread2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenshideread2(inputs)
	return ru_sidebar_lenshideread2(inputs)
});
export { sidebar_lenshideread2 as "sidebar_lensHideRead" }