/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Removefromfavorites2Inputs */

const en_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove from favorites`)
};

const es_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitar de favoritos`)
};

const pt_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remover dos favoritos`)
};

const fr_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retirer des favoris`)
};

const de_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aus Favoriten entfernen`)
};

const ja_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`お気に入りから削除`)
};

const ko_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`즐겨찾기에서 제거`)
};

const zh_cn2_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`从收藏中移除`)
};

const ru_sidebar_removefromfavorites2 = /** @type {(inputs: Sidebar_Removefromfavorites2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Убрать из избранного`)
};

/**
* | output |
* | --- |
* | "Remove from favorites" |
*
* @param {Sidebar_Removefromfavorites2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_removefromfavorites2 = /** @type {((inputs?: Sidebar_Removefromfavorites2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Removefromfavorites2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_removefromfavorites2(inputs)
	if (locale === "es") return es_sidebar_removefromfavorites2(inputs)
	if (locale === "pt") return pt_sidebar_removefromfavorites2(inputs)
	if (locale === "fr") return fr_sidebar_removefromfavorites2(inputs)
	if (locale === "de") return de_sidebar_removefromfavorites2(inputs)
	if (locale === "ja") return ja_sidebar_removefromfavorites2(inputs)
	if (locale === "ko") return ko_sidebar_removefromfavorites2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_removefromfavorites2(inputs)
	return ru_sidebar_removefromfavorites2(inputs)
});
export { sidebar_removefromfavorites2 as "sidebar_removeFromFavorites" }