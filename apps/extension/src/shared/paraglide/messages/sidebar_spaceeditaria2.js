/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Spaceeditaria2Inputs */

const en_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Edit ${i?.name}`)
};

const es_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Editar ${i?.name}`)
};

const pt_pt2_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Editar ${i?.name}`)
};

const fr_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Modifier ${i?.name}`)
};

const de_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} bearbeiten`)
};

const ja_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} を編集`)
};

const ko_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} 편집`)
};

const zh_cn2_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`编辑 ${i?.name}`)
};

const ru_sidebar_spaceeditaria2 = /** @type {(inputs: Sidebar_Spaceeditaria2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Изменить ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Edit {name}" |
*
* @param {Sidebar_Spaceeditaria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditaria2 = /** @type {((inputs: Sidebar_Spaceeditaria2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditaria2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spaceeditaria2(inputs)
	if (locale === "es") return es_sidebar_spaceeditaria2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_spaceeditaria2(inputs)
	if (locale === "fr") return fr_sidebar_spaceeditaria2(inputs)
	if (locale === "de") return de_sidebar_spaceeditaria2(inputs)
	if (locale === "ja") return ja_sidebar_spaceeditaria2(inputs)
	if (locale === "ko") return ko_sidebar_spaceeditaria2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spaceeditaria2(inputs)
	return ru_sidebar_spaceeditaria2(inputs)
});
export { sidebar_spaceeditaria2 as "sidebar_spaceEditAria" }