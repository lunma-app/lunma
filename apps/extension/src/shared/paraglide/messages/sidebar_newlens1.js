/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Newlens1Inputs */

const en_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New lens…`)
};

const es_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva lente…`)
};

const pt_pt2_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nova lens…`)
};

const fr_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle vue…`)
};

const de_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue Lens…`)
};

const ja_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新しいレンズ…`)
};

const ko_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 렌즈…`)
};

const zh_cn2_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新建镜头…`)
};

const ru_sidebar_newlens1 = /** @type {(inputs: Sidebar_Newlens1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Новая линза…`)
};

/**
* | output |
* | --- |
* | "New lens…" |
*
* @param {Sidebar_Newlens1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_newlens1 = /** @type {((inputs?: Sidebar_Newlens1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Newlens1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_newlens1(inputs)
	if (locale === "es") return es_sidebar_newlens1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_newlens1(inputs)
	if (locale === "fr") return fr_sidebar_newlens1(inputs)
	if (locale === "de") return de_sidebar_newlens1(inputs)
	if (locale === "ja") return ja_sidebar_newlens1(inputs)
	if (locale === "ko") return ko_sidebar_newlens1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_newlens1(inputs)
	return ru_sidebar_newlens1(inputs)
});
export { sidebar_newlens1 as "sidebar_newLens" }