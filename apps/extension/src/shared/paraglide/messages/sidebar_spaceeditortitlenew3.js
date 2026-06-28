/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spaceeditortitlenew3Inputs */

const en_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Space`)
};

const es_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo espacio`)
};

const pt_pt2_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Novo Space`)
};

const fr_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvel espace`)
};

const de_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neuer Space`)
};

const ja_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新しいスペース`)
};

const ko_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 스페이스`)
};

const zh_cn2_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新建空间`)
};

const ru_sidebar_spaceeditortitlenew3 = /** @type {(inputs: Sidebar_Spaceeditortitlenew3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Новое пространство`)
};

/**
* | output |
* | --- |
* | "New Space" |
*
* @param {Sidebar_Spaceeditortitlenew3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditortitlenew3 = /** @type {((inputs?: Sidebar_Spaceeditortitlenew3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditortitlenew3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spaceeditortitlenew3(inputs)
	if (locale === "es") return es_sidebar_spaceeditortitlenew3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_spaceeditortitlenew3(inputs)
	if (locale === "fr") return fr_sidebar_spaceeditortitlenew3(inputs)
	if (locale === "de") return de_sidebar_spaceeditortitlenew3(inputs)
	if (locale === "ja") return ja_sidebar_spaceeditortitlenew3(inputs)
	if (locale === "ko") return ko_sidebar_spaceeditortitlenew3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spaceeditortitlenew3(inputs)
	return ru_sidebar_spaceeditortitlenew3(inputs)
});
export { sidebar_spaceeditortitlenew3 as "sidebar_spaceEditorTitleNew" }