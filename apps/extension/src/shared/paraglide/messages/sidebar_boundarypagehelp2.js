/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Boundarypagehelp2Inputs */

const en_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Links off this page open in a new tab.`)
};

const es_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los enlaces fuera de esta página se abren en una nueva pestaña.`)
};

const pt_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ligações fora desta página abrem num novo separador.`)
};

const fr_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les liens hors de cette page s'ouvrent dans un nouvel onglet.`)
};

const de_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Links außerhalb dieser Seite öffnen in einem neuen Tab.`)
};

const ja_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このページ外のリンクは新しいタブで開きます。`)
};

const ko_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 페이지 외부 링크는 새 탭에서 열립니다.`)
};

const zh_cn2_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`离开此页面的链接将在新标签页中打开`)
};

const ru_sidebar_boundarypagehelp2 = /** @type {(inputs: Sidebar_Boundarypagehelp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ссылки с этой страницы открываются в новой вкладке.`)
};

/**
* | output |
* | --- |
* | "Links off this page open in a new tab." |
*
* @param {Sidebar_Boundarypagehelp2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarypagehelp2 = /** @type {((inputs?: Sidebar_Boundarypagehelp2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarypagehelp2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_boundarypagehelp2(inputs)
	if (locale === "es") return es_sidebar_boundarypagehelp2(inputs)
	if (locale === "pt") return pt_sidebar_boundarypagehelp2(inputs)
	if (locale === "fr") return fr_sidebar_boundarypagehelp2(inputs)
	if (locale === "de") return de_sidebar_boundarypagehelp2(inputs)
	if (locale === "ja") return ja_sidebar_boundarypagehelp2(inputs)
	if (locale === "ko") return ko_sidebar_boundarypagehelp2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_boundarypagehelp2(inputs)
	return ru_sidebar_boundarypagehelp2(inputs)
});
export { sidebar_boundarypagehelp2 as "sidebar_boundaryPageHelp" }