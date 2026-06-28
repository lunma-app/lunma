/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Editlenssheet2Inputs */

const en_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit lens`)
};

const es_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar lente`)
};

const pt_pt2_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar lens`)
};

const fr_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier la vue`)
};

const de_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lens bearbeiten`)
};

const ja_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`レンズを編集`)
};

const ko_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`렌즈 편집`)
};

const zh_cn2_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`编辑镜头`)
};

const ru_sidebar_editlenssheet2 = /** @type {(inputs: Sidebar_Editlenssheet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Изменить линзу`)
};

/**
* | output |
* | --- |
* | "Edit lens" |
*
* @param {Sidebar_Editlenssheet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_editlenssheet2 = /** @type {((inputs?: Sidebar_Editlenssheet2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Editlenssheet2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_editlenssheet2(inputs)
	if (locale === "es") return es_sidebar_editlenssheet2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_editlenssheet2(inputs)
	if (locale === "fr") return fr_sidebar_editlenssheet2(inputs)
	if (locale === "de") return de_sidebar_editlenssheet2(inputs)
	if (locale === "ja") return ja_sidebar_editlenssheet2(inputs)
	if (locale === "ko") return ko_sidebar_editlenssheet2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_editlenssheet2(inputs)
	return ru_sidebar_editlenssheet2(inputs)
});
export { sidebar_editlenssheet2 as "sidebar_editLensSheet" }