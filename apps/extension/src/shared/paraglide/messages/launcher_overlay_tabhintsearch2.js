/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Overlay_Tabhintsearch2Inputs */

const en_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab to search`)
};

const es_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab para buscar`)
};

const pt_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab para pesquisar`)
};

const fr_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab pour rechercher`)
};

const de_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab zum Suchen`)
};

const ja_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab で検索`)
};

const ko_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab으로 검색`)
};

const zh_cn2_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab 键搜索`)
};

const ru_launcher_overlay_tabhintsearch2 = /** @type {(inputs: Launcher_Overlay_Tabhintsearch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab для поиска`)
};

/**
* | output |
* | --- |
* | "Tab to search" |
*
* @param {Launcher_Overlay_Tabhintsearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_tabhintsearch2 = /** @type {((inputs?: Launcher_Overlay_Tabhintsearch2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Tabhintsearch2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_tabhintsearch2(inputs)
	if (locale === "es") return es_launcher_overlay_tabhintsearch2(inputs)
	if (locale === "pt") return pt_launcher_overlay_tabhintsearch2(inputs)
	if (locale === "fr") return fr_launcher_overlay_tabhintsearch2(inputs)
	if (locale === "de") return de_launcher_overlay_tabhintsearch2(inputs)
	if (locale === "ja") return ja_launcher_overlay_tabhintsearch2(inputs)
	if (locale === "ko") return ko_launcher_overlay_tabhintsearch2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_tabhintsearch2(inputs)
	return ru_launcher_overlay_tabhintsearch2(inputs)
});
export { launcher_overlay_tabhintsearch2 as "launcher_overlay_tabHintSearch" }