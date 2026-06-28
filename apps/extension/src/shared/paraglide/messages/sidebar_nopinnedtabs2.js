/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Nopinnedtabs2Inputs */

const en_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pinned tabs yet.`)
};

const es_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay pestañas fijadas.`)
};

const pt_pt2_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda sem separadores fixos.`)
};

const fr_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun onglet épinglé.`)
};

const de_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine angehefteten Tabs.`)
};

const ja_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`固定タブはまだありません。`)
};

const ko_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`고정된 탭이 없습니다.`)
};

const zh_cn2_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`暂无固定标签页`)
};

const ru_sidebar_nopinnedtabs2 = /** @type {(inputs: Sidebar_Nopinnedtabs2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Нет закреплённых вкладок.`)
};

/**
* | output |
* | --- |
* | "No pinned tabs yet." |
*
* @param {Sidebar_Nopinnedtabs2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_nopinnedtabs2 = /** @type {((inputs?: Sidebar_Nopinnedtabs2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Nopinnedtabs2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_nopinnedtabs2(inputs)
	if (locale === "es") return es_sidebar_nopinnedtabs2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_nopinnedtabs2(inputs)
	if (locale === "fr") return fr_sidebar_nopinnedtabs2(inputs)
	if (locale === "de") return de_sidebar_nopinnedtabs2(inputs)
	if (locale === "ja") return ja_sidebar_nopinnedtabs2(inputs)
	if (locale === "ko") return ko_sidebar_nopinnedtabs2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_nopinnedtabs2(inputs)
	return ru_sidebar_nopinnedtabs2(inputs)
});
export { sidebar_nopinnedtabs2 as "sidebar_noPinnedTabs" }