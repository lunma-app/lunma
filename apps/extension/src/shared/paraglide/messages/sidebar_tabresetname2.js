/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Tabresetname2Inputs */

const en_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reset name`)
};

const es_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restablecer nombre`)
};

const pt_pt2_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repor nome`)
};

const fr_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réinitialiser le nom`)
};

const de_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name zurücksetzen`)
};

const ja_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`名前をリセット`)
};

const ko_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이름 초기화`)
};

const zh_cn2_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`重置名称`)
};

const ru_sidebar_tabresetname2 = /** @type {(inputs: Sidebar_Tabresetname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Сбросить название`)
};

/**
* | output |
* | --- |
* | "Reset name" |
*
* @param {Sidebar_Tabresetname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabresetname2 = /** @type {((inputs?: Sidebar_Tabresetname2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabresetname2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_tabresetname2(inputs)
	if (locale === "es") return es_sidebar_tabresetname2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_tabresetname2(inputs)
	if (locale === "fr") return fr_sidebar_tabresetname2(inputs)
	if (locale === "de") return de_sidebar_tabresetname2(inputs)
	if (locale === "ja") return ja_sidebar_tabresetname2(inputs)
	if (locale === "ko") return ko_sidebar_tabresetname2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_tabresetname2(inputs)
	return ru_sidebar_tabresetname2(inputs)
});
export { sidebar_tabresetname2 as "sidebar_tabResetName" }