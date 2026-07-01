/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_PlaceholderInputs */

const en_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search tabs, bookmarks…`)
};

const es_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar pestañas, marcadores…`)
};

const pt_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pesquisar separadores, marcadores…`)
};

const fr_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des onglets, marque-pages…`)
};

const de_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tabs, Lesezeichen suchen…`)
};

const ja_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`タブ、ブックマークを検索…`)
};

const ko_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭, 북마크 검색…`)
};

const zh_cn2_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`搜索标签页、书签…`)
};

const ru_launcher_placeholder = /** @type {(inputs: Launcher_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поиск вкладок, закладок…`)
};

/**
* | output |
* | --- |
* | "Search tabs, bookmarks…" |
*
* @param {Launcher_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_placeholder = /** @type {((inputs?: Launcher_PlaceholderInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_PlaceholderInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_placeholder(inputs)
	if (locale === "es") return es_launcher_placeholder(inputs)
	if (locale === "pt") return pt_launcher_placeholder(inputs)
	if (locale === "fr") return fr_launcher_placeholder(inputs)
	if (locale === "de") return de_launcher_placeholder(inputs)
	if (locale === "ja") return ja_launcher_placeholder(inputs)
	if (locale === "ko") return ko_launcher_placeholder(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_placeholder(inputs)
	return ru_launcher_placeholder(inputs)
});