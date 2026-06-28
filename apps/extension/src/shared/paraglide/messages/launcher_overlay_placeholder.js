/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Overlay_PlaceholderInputs */

const en_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search tabs, bookmarks…`)
};

const es_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar pestañas, marcadores…`)
};

const pt_pt2_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pesquisar separadores, marcadores…`)
};

const fr_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des onglets, marque-pages…`)
};

const de_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tabs, Lesezeichen suchen…`)
};

const ja_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`タブ、ブックマークを検索…`)
};

const ko_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭, 북마크 검색…`)
};

const zh_cn2_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`搜索标签页、书签…`)
};

const ru_launcher_overlay_placeholder = /** @type {(inputs: Launcher_Overlay_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Поиск вкладок, закладок…`)
};

/**
* | output |
* | --- |
* | "Search tabs, bookmarks…" |
*
* @param {Launcher_Overlay_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_overlay_placeholder = /** @type {((inputs?: Launcher_Overlay_PlaceholderInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_PlaceholderInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_placeholder(inputs)
	if (locale === "es") return es_launcher_overlay_placeholder(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_overlay_placeholder(inputs)
	if (locale === "fr") return fr_launcher_overlay_placeholder(inputs)
	if (locale === "de") return de_launcher_overlay_placeholder(inputs)
	if (locale === "ja") return ja_launcher_overlay_placeholder(inputs)
	if (locale === "ko") return ko_launcher_overlay_placeholder(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_placeholder(inputs)
	return ru_launcher_overlay_placeholder(inputs)
});