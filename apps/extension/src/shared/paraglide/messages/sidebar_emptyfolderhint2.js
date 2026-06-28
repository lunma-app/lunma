/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Emptyfolderhint2Inputs */

const en_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empty — drag tabs here.`)
};

const es_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vacío — arrastra pestañas aquí.`)
};

const pt_pt2_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vazia — arraste separadores para aqui.`)
};

const fr_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vide — glissez des onglets ici.`)
};

const de_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leer — Tabs hierher ziehen.`)
};

const ja_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`空です — タブをここにドラッグ。`)
};

const ko_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`비어 있음 — 탭을 여기로 드래그하세요.`)
};

const zh_cn2_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`空文件夹 — 拖入标签页`)
};

const ru_sidebar_emptyfolderhint2 = /** @type {(inputs: Sidebar_Emptyfolderhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Пусто — перетащите вкладки сюда.`)
};

/**
* | output |
* | --- |
* | "Empty — drag tabs here." |
*
* @param {Sidebar_Emptyfolderhint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_emptyfolderhint2 = /** @type {((inputs?: Sidebar_Emptyfolderhint2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Emptyfolderhint2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_emptyfolderhint2(inputs)
	if (locale === "es") return es_sidebar_emptyfolderhint2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_emptyfolderhint2(inputs)
	if (locale === "fr") return fr_sidebar_emptyfolderhint2(inputs)
	if (locale === "de") return de_sidebar_emptyfolderhint2(inputs)
	if (locale === "ja") return ja_sidebar_emptyfolderhint2(inputs)
	if (locale === "ko") return ko_sidebar_emptyfolderhint2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_emptyfolderhint2(inputs)
	return ru_sidebar_emptyfolderhint2(inputs)
});
export { sidebar_emptyfolderhint2 as "sidebar_emptyFolderHint" }