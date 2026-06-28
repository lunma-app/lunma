/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensopenfeedsite3Inputs */

const en_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open the feed's website in a new tab`)
};

const es_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir el sitio web del feed en una nueva pestaña`)
};

const pt_pt2_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir o site do feed num novo separador`)
};

const fr_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le site du flux dans un nouvel onglet`)
};

const de_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feed-Website in einem neuen Tab öffnen`)
};

const ja_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィードのウェブサイトを新しいタブで開く`)
};

const ko_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 탭에서 피드 웹사이트 열기`)
};

const zh_cn2_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`在新标签页中打开订阅源网站`)
};

const ru_sidebar_lensopenfeedsite3 = /** @type {(inputs: Sidebar_Lensopenfeedsite3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть сайт ленты в новой вкладке`)
};

/**
* | output |
* | --- |
* | "Open the feed's website in a new tab" |
*
* @param {Sidebar_Lensopenfeedsite3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenfeedsite3 = /** @type {((inputs?: Sidebar_Lensopenfeedsite3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenfeedsite3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensopenfeedsite3(inputs)
	if (locale === "es") return es_sidebar_lensopenfeedsite3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensopenfeedsite3(inputs)
	if (locale === "fr") return fr_sidebar_lensopenfeedsite3(inputs)
	if (locale === "de") return de_sidebar_lensopenfeedsite3(inputs)
	if (locale === "ja") return ja_sidebar_lensopenfeedsite3(inputs)
	if (locale === "ko") return ko_sidebar_lensopenfeedsite3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensopenfeedsite3(inputs)
	return ru_sidebar_lensopenfeedsite3(inputs)
});
export { sidebar_lensopenfeedsite3 as "sidebar_lensOpenFeedSite" }