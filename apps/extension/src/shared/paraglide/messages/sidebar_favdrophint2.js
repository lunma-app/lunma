/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Favdrophint2Inputs */

const en_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Drop to favorite`)
};

const es_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soltar para añadir a favoritos`)
};

const pt_pt2_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Largar para adicionar aos favoritos`)
};

const fr_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déposer en favori`)
};

const de_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hierher ziehen zum Favorisieren`)
};

const ja_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ドロップしてお気に入りに追加`)
};

const ko_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`여기에 놓아 즐겨찾기에 추가`)
};

const zh_cn2_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`拖放至此以收藏`)
};

const ru_sidebar_favdrophint2 = /** @type {(inputs: Sidebar_Favdrophint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Перетащите, чтобы добавить в избранное`)
};

/**
* | output |
* | --- |
* | "Drop to favorite" |
*
* @param {Sidebar_Favdrophint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_favdrophint2 = /** @type {((inputs?: Sidebar_Favdrophint2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Favdrophint2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_favdrophint2(inputs)
	if (locale === "es") return es_sidebar_favdrophint2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_favdrophint2(inputs)
	if (locale === "fr") return fr_sidebar_favdrophint2(inputs)
	if (locale === "de") return de_sidebar_favdrophint2(inputs)
	if (locale === "ja") return ja_sidebar_favdrophint2(inputs)
	if (locale === "ko") return ko_sidebar_favdrophint2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_favdrophint2(inputs)
	return ru_sidebar_favdrophint2(inputs)
});
export { sidebar_favdrophint2 as "sidebar_favDropHint" }