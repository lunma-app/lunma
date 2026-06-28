/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Tempfavorite1Inputs */

const en_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Favorite`)
};

const es_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Favorito`)
};

const pt_pt2_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Favorito`)
};

const fr_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Favori`)
};

const de_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Favorit`)
};

const ja_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`お気に入り`)
};

const ko_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`즐겨찾기`)
};

const zh_cn2_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`收藏`)
};

const ru_sidebar_tempfavorite1 = /** @type {(inputs: Sidebar_Tempfavorite1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`В избранное`)
};

/**
* | output |
* | --- |
* | "Favorite" |
*
* @param {Sidebar_Tempfavorite1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tempfavorite1 = /** @type {((inputs?: Sidebar_Tempfavorite1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tempfavorite1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_tempfavorite1(inputs)
	if (locale === "es") return es_sidebar_tempfavorite1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_tempfavorite1(inputs)
	if (locale === "fr") return fr_sidebar_tempfavorite1(inputs)
	if (locale === "de") return de_sidebar_tempfavorite1(inputs)
	if (locale === "ja") return ja_sidebar_tempfavorite1(inputs)
	if (locale === "ko") return ko_sidebar_tempfavorite1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_tempfavorite1(inputs)
	return ru_sidebar_tempfavorite1(inputs)
});
export { sidebar_tempfavorite1 as "sidebar_tempFavorite" }