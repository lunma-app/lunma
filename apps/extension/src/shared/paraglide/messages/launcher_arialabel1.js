/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Arialabel1Inputs */

const en_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search tabs, bookmarks, and history`)
};

const es_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar pestañas, marcadores e historial`)
};

const pt_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pesquisar separadores, marcadores e histórico`)
};

const fr_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des onglets, marque-pages et l'historique`)
};

const de_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tabs, Lesezeichen und Verlauf suchen`)
};

const ja_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`タブ、ブックマーク、履歴を検索`)
};

const ko_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭, 북마크, 기록 검색`)
};

const zh_cn2_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`搜索标签页、书签和历史记录`)
};

const ru_launcher_arialabel1 = /** @type {(inputs: Launcher_Arialabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поиск вкладок, закладок и истории`)
};

/**
* | output |
* | --- |
* | "Search tabs, bookmarks, and history" |
*
* @param {Launcher_Arialabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_arialabel1 = /** @type {((inputs?: Launcher_Arialabel1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Arialabel1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_arialabel1(inputs)
	if (locale === "es") return es_launcher_arialabel1(inputs)
	if (locale === "pt") return pt_launcher_arialabel1(inputs)
	if (locale === "fr") return fr_launcher_arialabel1(inputs)
	if (locale === "de") return de_launcher_arialabel1(inputs)
	if (locale === "ja") return ja_launcher_arialabel1(inputs)
	if (locale === "ko") return ko_launcher_arialabel1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_arialabel1(inputs)
	return ru_launcher_arialabel1(inputs)
});
export { launcher_arialabel1 as "launcher_ariaLabel" }