/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Boundarypageslabel2Inputs */

const en_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pages this tab stays on`)
};

const es_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Páginas en las que permanece esta pestaña`)
};

const pt_pt2_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Páginas onde este separador permanece`)
};

const fr_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pages sur lesquelles cet onglet reste`)
};

const de_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seiten, auf denen dieser Tab bleibt`)
};

const ja_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このタブが留まるページ`)
};

const ko_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 탭이 머무는 페이지`)
};

const zh_cn2_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`此标签页停留的页面`)
};

const ru_sidebar_boundarypageslabel2 = /** @type {(inputs: Sidebar_Boundarypageslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Страницы этой вкладки`)
};

/**
* | output |
* | --- |
* | "Pages this tab stays on" |
*
* @param {Sidebar_Boundarypageslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarypageslabel2 = /** @type {((inputs?: Sidebar_Boundarypageslabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarypageslabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_boundarypageslabel2(inputs)
	if (locale === "es") return es_sidebar_boundarypageslabel2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_boundarypageslabel2(inputs)
	if (locale === "fr") return fr_sidebar_boundarypageslabel2(inputs)
	if (locale === "de") return de_sidebar_boundarypageslabel2(inputs)
	if (locale === "ja") return ja_sidebar_boundarypageslabel2(inputs)
	if (locale === "ko") return ko_sidebar_boundarypageslabel2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_boundarypageslabel2(inputs)
	return ru_sidebar_boundarypageslabel2(inputs)
});
export { sidebar_boundarypageslabel2 as "sidebar_boundaryPagesLabel" }