/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Favoriteactions1Inputs */

const en_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Favorite actions`)
};

const es_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acciones de favoritos`)
};

const pt_pt2_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ações de favoritos`)
};

const fr_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions des favoris`)
};

const de_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Favoritenaktionen`)
};

const ja_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`お気に入りアクション`)
};

const ko_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`즐겨찾기 작업`)
};

const zh_cn2_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`收藏操作`)
};

const ru_sidebar_favoriteactions1 = /** @type {(inputs: Sidebar_Favoriteactions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Действия с избранным`)
};

/**
* | output |
* | --- |
* | "Favorite actions" |
*
* @param {Sidebar_Favoriteactions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_favoriteactions1 = /** @type {((inputs?: Sidebar_Favoriteactions1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Favoriteactions1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_favoriteactions1(inputs)
	if (locale === "es") return es_sidebar_favoriteactions1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_favoriteactions1(inputs)
	if (locale === "fr") return fr_sidebar_favoriteactions1(inputs)
	if (locale === "de") return de_sidebar_favoriteactions1(inputs)
	if (locale === "ja") return ja_sidebar_favoriteactions1(inputs)
	if (locale === "ko") return ko_sidebar_favoriteactions1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_favoriteactions1(inputs)
	return ru_sidebar_favoriteactions1(inputs)
});
export { sidebar_favoriteactions1 as "sidebar_favoriteActions" }