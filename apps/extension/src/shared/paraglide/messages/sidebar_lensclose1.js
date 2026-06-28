/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensclose1Inputs */

const en_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close tab`)
};

const es_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar pestaña`)
};

const pt_pt2_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fechar separador`)
};

const fr_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer l'onglet`)
};

const de_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab schließen`)
};

const ja_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`タブを閉じる`)
};

const ko_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭 닫기`)
};

const zh_cn2_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`关闭标签页`)
};

const ru_sidebar_lensclose1 = /** @type {(inputs: Sidebar_Lensclose1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Закрыть вкладку`)
};

/**
* | output |
* | --- |
* | "Close tab" |
*
* @param {Sidebar_Lensclose1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensclose1 = /** @type {((inputs?: Sidebar_Lensclose1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensclose1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensclose1(inputs)
	if (locale === "es") return es_sidebar_lensclose1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensclose1(inputs)
	if (locale === "fr") return fr_sidebar_lensclose1(inputs)
	if (locale === "de") return de_sidebar_lensclose1(inputs)
	if (locale === "ja") return ja_sidebar_lensclose1(inputs)
	if (locale === "ko") return ko_sidebar_lensclose1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensclose1(inputs)
	return ru_sidebar_lensclose1(inputs)
});
export { sidebar_lensclose1 as "sidebar_lensClose" }