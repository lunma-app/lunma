/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensrefresh1Inputs */

const en_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refresh now`)
};

const es_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar ahora`)
};

const pt_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atualizar agora`)
};

const fr_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiser`)
};

const de_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jetzt aktualisieren`)
};

const ja_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`今すぐ更新`)
};

const ko_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지금 새로 고침`)
};

const zh_cn2_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`立即刷新`)
};

const ru_sidebar_lensrefresh1 = /** @type {(inputs: Sidebar_Lensrefresh1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Обновить`)
};

/**
* | output |
* | --- |
* | "Refresh now" |
*
* @param {Sidebar_Lensrefresh1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensrefresh1 = /** @type {((inputs?: Sidebar_Lensrefresh1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensrefresh1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensrefresh1(inputs)
	if (locale === "es") return es_sidebar_lensrefresh1(inputs)
	if (locale === "pt") return pt_sidebar_lensrefresh1(inputs)
	if (locale === "fr") return fr_sidebar_lensrefresh1(inputs)
	if (locale === "de") return de_sidebar_lensrefresh1(inputs)
	if (locale === "ja") return ja_sidebar_lensrefresh1(inputs)
	if (locale === "ko") return ko_sidebar_lensrefresh1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensrefresh1(inputs)
	return ru_sidebar_lensrefresh1(inputs)
});
export { sidebar_lensrefresh1 as "sidebar_lensRefresh" }