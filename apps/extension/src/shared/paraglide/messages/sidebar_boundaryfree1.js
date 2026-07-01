/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Boundaryfree1Inputs */

const en_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This tab navigates freely.`)
};

const es_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta pestaña navega libremente.`)
};

const pt_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este separador navega livremente.`)
};

const fr_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cet onglet navigue librement.`)
};

const de_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dieser Tab navigiert frei.`)
};

const ja_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このタブは自由に移動できます。`)
};

const ko_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 탭은 자유롭게 탐색합니다.`)
};

const zh_cn2_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`此标签页可自由导航`)
};

const ru_sidebar_boundaryfree1 = /** @type {(inputs: Sidebar_Boundaryfree1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Эта вкладка переходит свободно.`)
};

/**
* | output |
* | --- |
* | "This tab navigates freely." |
*
* @param {Sidebar_Boundaryfree1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundaryfree1 = /** @type {((inputs?: Sidebar_Boundaryfree1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundaryfree1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_boundaryfree1(inputs)
	if (locale === "es") return es_sidebar_boundaryfree1(inputs)
	if (locale === "pt") return pt_sidebar_boundaryfree1(inputs)
	if (locale === "fr") return fr_sidebar_boundaryfree1(inputs)
	if (locale === "de") return de_sidebar_boundaryfree1(inputs)
	if (locale === "ja") return ja_sidebar_boundaryfree1(inputs)
	if (locale === "ko") return ko_sidebar_boundaryfree1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_boundaryfree1(inputs)
	return ru_sidebar_boundaryfree1(inputs)
});
export { sidebar_boundaryfree1 as "sidebar_boundaryFree" }