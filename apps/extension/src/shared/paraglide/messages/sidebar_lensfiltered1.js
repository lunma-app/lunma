/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensfiltered1Inputs */

const en_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lens is filtered — open overview to change filter`)
};

const es_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lente filtrada — abre el resumen para cambiar el filtro`)
};

const pt_pt2_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lens filtrada — abrir vista geral para alterar filtro`)
};

const fr_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vue filtrée — ouvrez l'aperçu pour changer le filtre`)
};

const de_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lens ist gefiltert — Übersicht öffnen, um Filter zu ändern`)
};

const ja_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`レンズがフィルター中 — 概要を開いてフィルターを変更`)
};

const ko_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`렌즈가 필터링됨 — 개요를 열어 필터 변경`)
};

const zh_cn2_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`镜头已过滤 — 打开概览以更改过滤条件`)
};

const ru_sidebar_lensfiltered1 = /** @type {(inputs: Sidebar_Lensfiltered1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Линза отфильтрована — откройте обзор для изменения фильтра`)
};

/**
* | output |
* | --- |
* | "Lens is filtered — open overview to change filter" |
*
* @param {Sidebar_Lensfiltered1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensfiltered1 = /** @type {((inputs?: Sidebar_Lensfiltered1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensfiltered1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensfiltered1(inputs)
	if (locale === "es") return es_sidebar_lensfiltered1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensfiltered1(inputs)
	if (locale === "fr") return fr_sidebar_lensfiltered1(inputs)
	if (locale === "de") return de_sidebar_lensfiltered1(inputs)
	if (locale === "ja") return ja_sidebar_lensfiltered1(inputs)
	if (locale === "ko") return ko_sidebar_lensfiltered1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensfiltered1(inputs)
	return ru_sidebar_lensfiltered1(inputs)
});
export { sidebar_lensfiltered1 as "sidebar_lensFiltered" }