/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Nofavorites1Inputs */

const en_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No favorites yet.`)
};

const es_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay favoritos.`)
};

const pt_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda sem favoritos.`)
};

const fr_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun favori pour l'instant.`)
};

const de_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Favoriten.`)
};

const ja_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`お気に入りはまだありません。`)
};

const ko_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`즐겨찾기가 없습니다.`)
};

const zh_cn2_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`暂无收藏`)
};

const ru_sidebar_nofavorites1 = /** @type {(inputs: Sidebar_Nofavorites1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Нет избранного.`)
};

/**
* | output |
* | --- |
* | "No favorites yet." |
*
* @param {Sidebar_Nofavorites1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_nofavorites1 = /** @type {((inputs?: Sidebar_Nofavorites1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Nofavorites1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_nofavorites1(inputs)
	if (locale === "es") return es_sidebar_nofavorites1(inputs)
	if (locale === "pt") return pt_sidebar_nofavorites1(inputs)
	if (locale === "fr") return fr_sidebar_nofavorites1(inputs)
	if (locale === "de") return de_sidebar_nofavorites1(inputs)
	if (locale === "ja") return ja_sidebar_nofavorites1(inputs)
	if (locale === "ko") return ko_sidebar_nofavorites1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_nofavorites1(inputs)
	return ru_sidebar_nofavorites1(inputs)
});
export { sidebar_nofavorites1 as "sidebar_noFavorites" }