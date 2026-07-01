/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Favdraghint2Inputs */

const en_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Drag a tab up here to favorite it.`)
};

const es_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arrastra una pestaña aquí para añadirla a favoritos.`)
};

const pt_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arraste um separador até aqui para o adicionar aos favoritos.`)
};

const fr_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Faites glisser un onglet ici pour l'ajouter aux favoris.`)
};

const de_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab hierher ziehen, um ihn zu favorisieren.`)
};

const ja_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`タブをここにドラッグしてお気に入りに追加。`)
};

const ko_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭을 여기로 드래그하여 즐겨찾기에 추가하세요.`)
};

const zh_cn2_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`将标签页拖到此处以收藏。`)
};

const ru_sidebar_favdraghint2 = /** @type {(inputs: Sidebar_Favdraghint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Перетащите вкладку сюда, чтобы добавить в избранное.`)
};

/**
* | output |
* | --- |
* | "Drag a tab up here to favorite it." |
*
* @param {Sidebar_Favdraghint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_favdraghint2 = /** @type {((inputs?: Sidebar_Favdraghint2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Favdraghint2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_favdraghint2(inputs)
	if (locale === "es") return es_sidebar_favdraghint2(inputs)
	if (locale === "pt") return pt_sidebar_favdraghint2(inputs)
	if (locale === "fr") return fr_sidebar_favdraghint2(inputs)
	if (locale === "de") return de_sidebar_favdraghint2(inputs)
	if (locale === "ja") return ja_sidebar_favdraghint2(inputs)
	if (locale === "ko") return ko_sidebar_favdraghint2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_favdraghint2(inputs)
	return ru_sidebar_favdraghint2(inputs)
});
export { sidebar_favdraghint2 as "sidebar_favDragHint" }