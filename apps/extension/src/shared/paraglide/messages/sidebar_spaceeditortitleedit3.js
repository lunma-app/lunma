/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spaceeditortitleedit3Inputs */

const en_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Space`)
};

const es_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar espacio`)
};

const pt_pt2_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Space`)
};

const fr_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier l'espace`)
};

const de_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Space bearbeiten`)
};

const ja_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`スペースを編集`)
};

const ko_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`스페이스 편집`)
};

const zh_cn2_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`编辑空间`)
};

const ru_sidebar_spaceeditortitleedit3 = /** @type {(inputs: Sidebar_Spaceeditortitleedit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Изменить пространство`)
};

/**
* | output |
* | --- |
* | "Edit Space" |
*
* @param {Sidebar_Spaceeditortitleedit3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditortitleedit3 = /** @type {((inputs?: Sidebar_Spaceeditortitleedit3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditortitleedit3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spaceeditortitleedit3(inputs)
	if (locale === "es") return es_sidebar_spaceeditortitleedit3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_spaceeditortitleedit3(inputs)
	if (locale === "fr") return fr_sidebar_spaceeditortitleedit3(inputs)
	if (locale === "de") return de_sidebar_spaceeditortitleedit3(inputs)
	if (locale === "ja") return ja_sidebar_spaceeditortitleedit3(inputs)
	if (locale === "ko") return ko_sidebar_spaceeditortitleedit3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spaceeditortitleedit3(inputs)
	return ru_sidebar_spaceeditortitleedit3(inputs)
});
export { sidebar_spaceeditortitleedit3 as "sidebar_spaceEditorTitleEdit" }