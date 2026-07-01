/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Bookmarksdescription1Inputs */

const en_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show matching bookmarks in the launcher.`)
};

const es_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Muestra marcadores coincidentes en el lanzador.`)
};

const pt_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar marcadores correspondentes no launcher.`)
};

const fr_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher les marque-pages correspondants dans le lanceur.`)
};

const de_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passende Lesezeichen im Launcher anzeigen.`)
};

const ja_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーで一致するブックマークを表示。`)
};

const ko_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처에서 일치하는 북마크를 표시합니다.`)
};

const zh_cn2_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`在启动器中显示匹配的书签`)
};

const ru_options_bookmarksdescription1 = /** @type {(inputs: Options_Bookmarksdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Показывать закладки в лаунчере.`)
};

/**
* | output |
* | --- |
* | "Show matching bookmarks in the launcher." |
*
* @param {Options_Bookmarksdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_bookmarksdescription1 = /** @type {((inputs?: Options_Bookmarksdescription1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Bookmarksdescription1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_bookmarksdescription1(inputs)
	if (locale === "es") return es_options_bookmarksdescription1(inputs)
	if (locale === "pt") return pt_options_bookmarksdescription1(inputs)
	if (locale === "fr") return fr_options_bookmarksdescription1(inputs)
	if (locale === "de") return de_options_bookmarksdescription1(inputs)
	if (locale === "ja") return ja_options_bookmarksdescription1(inputs)
	if (locale === "ko") return ko_options_bookmarksdescription1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_bookmarksdescription1(inputs)
	return ru_options_bookmarksdescription1(inputs)
});
export { options_bookmarksdescription1 as "options_bookmarksDescription" }