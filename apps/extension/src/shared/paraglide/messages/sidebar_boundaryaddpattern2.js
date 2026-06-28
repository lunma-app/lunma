/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Boundaryaddpattern2Inputs */

const en_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a URL pattern`)
};

const es_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir un patrón de URL`)
};

const pt_pt2_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adicionar padrão de URL`)
};

const fr_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un motif URL`)
};

const de_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL-Muster hinzufügen`)
};

const ja_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL パターンを追加`)
};

const ko_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL 패턴 추가`)
};

const zh_cn2_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`添加 URL 模式`)
};

const ru_sidebar_boundaryaddpattern2 = /** @type {(inputs: Sidebar_Boundaryaddpattern2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Добавить шаблон URL`)
};

/**
* | output |
* | --- |
* | "Add a URL pattern" |
*
* @param {Sidebar_Boundaryaddpattern2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundaryaddpattern2 = /** @type {((inputs?: Sidebar_Boundaryaddpattern2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundaryaddpattern2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_boundaryaddpattern2(inputs)
	if (locale === "es") return es_sidebar_boundaryaddpattern2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_boundaryaddpattern2(inputs)
	if (locale === "fr") return fr_sidebar_boundaryaddpattern2(inputs)
	if (locale === "de") return de_sidebar_boundaryaddpattern2(inputs)
	if (locale === "ja") return ja_sidebar_boundaryaddpattern2(inputs)
	if (locale === "ko") return ko_sidebar_boundaryaddpattern2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_boundaryaddpattern2(inputs)
	return ru_sidebar_boundaryaddpattern2(inputs)
});
export { sidebar_boundaryaddpattern2 as "sidebar_boundaryAddPattern" }