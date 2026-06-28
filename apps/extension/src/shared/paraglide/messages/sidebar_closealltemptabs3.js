/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Closealltemptabs3Inputs */

const en_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close all temporary tabs`)
};

const es_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar todas las pestañas temporales`)
};

const pt_pt2_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fechar todos os separadores temporários`)
};

const fr_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer tous les onglets temporaires`)
};

const de_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle temporären Tabs schließen`)
};

const ja_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`一時タブをすべて閉じる`)
};

const ko_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`임시 탭 모두 닫기`)
};

const zh_cn2_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`关闭所有临时标签页`)
};

const ru_sidebar_closealltemptabs3 = /** @type {(inputs: Sidebar_Closealltemptabs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Закрыть все временные вкладки`)
};

/**
* | output |
* | --- |
* | "Close all temporary tabs" |
*
* @param {Sidebar_Closealltemptabs3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_closealltemptabs3 = /** @type {((inputs?: Sidebar_Closealltemptabs3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Closealltemptabs3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_closealltemptabs3(inputs)
	if (locale === "es") return es_sidebar_closealltemptabs3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_closealltemptabs3(inputs)
	if (locale === "fr") return fr_sidebar_closealltemptabs3(inputs)
	if (locale === "de") return de_sidebar_closealltemptabs3(inputs)
	if (locale === "ja") return ja_sidebar_closealltemptabs3(inputs)
	if (locale === "ko") return ko_sidebar_closealltemptabs3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_closealltemptabs3(inputs)
	return ru_sidebar_closealltemptabs3(inputs)
});
export { sidebar_closealltemptabs3 as "sidebar_closeAllTempTabs" }