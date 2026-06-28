/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensnothinghere2Inputs */

const en_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nothing here right now.`)
};

const es_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nada aquí por ahora.`)
};

const pt_pt2_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nada aqui de momento.`)
};

const fr_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rien ici pour l'instant.`)
};

const de_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gerade nichts hier.`)
};

const ja_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`今は何もありません。`)
};

const ko_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지금은 내용이 없습니다.`)
};

const zh_cn2_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`暂时没有内容`)
};

const ru_sidebar_lensnothinghere2 = /** @type {(inputs: Sidebar_Lensnothinghere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Здесь пока ничего нет.`)
};

/**
* | output |
* | --- |
* | "Nothing here right now." |
*
* @param {Sidebar_Lensnothinghere2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensnothinghere2 = /** @type {((inputs?: Sidebar_Lensnothinghere2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensnothinghere2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensnothinghere2(inputs)
	if (locale === "es") return es_sidebar_lensnothinghere2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensnothinghere2(inputs)
	if (locale === "fr") return fr_sidebar_lensnothinghere2(inputs)
	if (locale === "de") return de_sidebar_lensnothinghere2(inputs)
	if (locale === "ja") return ja_sidebar_lensnothinghere2(inputs)
	if (locale === "ko") return ko_sidebar_lensnothinghere2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensnothinghere2(inputs)
	return ru_sidebar_lensnothinghere2(inputs)
});
export { sidebar_lensnothinghere2 as "sidebar_lensNothingHere" }