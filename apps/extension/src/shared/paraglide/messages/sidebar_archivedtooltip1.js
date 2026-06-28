/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Archivedtooltip1Inputs */

const en_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recently archived — open in Settings`)
};

const es_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivado recientemente — abrir en Ajustes`)
};

const pt_pt2_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arquivado recentemente — abrir nas Definições`)
};

const fr_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récemment archivé — ouvrir dans les Paramètres`)
};

const de_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kürzlich archiviert — in den Einstellungen öffnen`)
};

const ja_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`最近アーカイブ — 設定で開く`)
};

const ko_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`최근 보관됨 — 설정에서 열기`)
};

const zh_cn2_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`最近已归档 — 在设置中查看`)
};

const ru_sidebar_archivedtooltip1 = /** @type {(inputs: Sidebar_Archivedtooltip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Недавно архивировано — откройте настройки`)
};

/**
* | output |
* | --- |
* | "Recently archived — open in Settings" |
*
* @param {Sidebar_Archivedtooltip1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_archivedtooltip1 = /** @type {((inputs?: Sidebar_Archivedtooltip1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Archivedtooltip1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_archivedtooltip1(inputs)
	if (locale === "es") return es_sidebar_archivedtooltip1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_archivedtooltip1(inputs)
	if (locale === "fr") return fr_sidebar_archivedtooltip1(inputs)
	if (locale === "de") return de_sidebar_archivedtooltip1(inputs)
	if (locale === "ja") return ja_sidebar_archivedtooltip1(inputs)
	if (locale === "ko") return ko_sidebar_archivedtooltip1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_archivedtooltip1(inputs)
	return ru_sidebar_archivedtooltip1(inputs)
});
export { sidebar_archivedtooltip1 as "sidebar_archivedTooltip" }