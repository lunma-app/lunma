/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Tabsgroupintro2Inputs */

const en_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How tabs open, dedupe, and stay on their site.`)
};

const es_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo se abren las pestañas, se deduplicarlas y se mantienen en su sitio.`)
};

const pt_pt2_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Como os separadores abrem, eliminam duplicados e ficam no seu site.`)
};

const fr_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment les onglets s'ouvrent, se dédoublonnent et restent sur leur site.`)
};

const de_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wie Tabs geöffnet werden, Duplikate vermieden werden und Tabs auf ihrer Site bleiben.`)
};

const ja_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`タブの開き方、重複排除、サイトへの固定方法。`)
};

const ko_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭이 열리고 중복을 제거하며 해당 사이트에 머무는 방식입니다.`)
};

const zh_cn2_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`标签页的打开、去重和站点锁定方式`)
};

const ru_options_tabsgroupintro2 = /** @type {(inputs: Options_Tabsgroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Как открываются вкладки, дедупликация и привязка к сайту.`)
};

/**
* | output |
* | --- |
* | "How tabs open, dedupe, and stay on their site." |
*
* @param {Options_Tabsgroupintro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_tabsgroupintro2 = /** @type {((inputs?: Options_Tabsgroupintro2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Tabsgroupintro2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_tabsgroupintro2(inputs)
	if (locale === "es") return es_options_tabsgroupintro2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_tabsgroupintro2(inputs)
	if (locale === "fr") return fr_options_tabsgroupintro2(inputs)
	if (locale === "de") return de_options_tabsgroupintro2(inputs)
	if (locale === "ja") return ja_options_tabsgroupintro2(inputs)
	if (locale === "ko") return ko_options_tabsgroupintro2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_tabsgroupintro2(inputs)
	return ru_options_tabsgroupintro2(inputs)
});
export { options_tabsgroupintro2 as "options_tabsGroupIntro" }