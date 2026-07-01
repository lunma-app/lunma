/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensopenallfeed3Inputs */

const en_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open all`)
};

const es_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir todo`)
};

const pt_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir tudo`)
};

const fr_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout ouvrir`)
};

const de_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle öffnen`)
};

const ja_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべて開く`)
};

const ko_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 열기`)
};

const zh_cn2_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`全部打开`)
};

const ru_sidebar_lensopenallfeed3 = /** @type {(inputs: Sidebar_Lensopenallfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть все`)
};

/**
* | output |
* | --- |
* | "Open all" |
*
* @param {Sidebar_Lensopenallfeed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenallfeed3 = /** @type {((inputs?: Sidebar_Lensopenallfeed3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenallfeed3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensopenallfeed3(inputs)
	if (locale === "es") return es_sidebar_lensopenallfeed3(inputs)
	if (locale === "pt") return pt_sidebar_lensopenallfeed3(inputs)
	if (locale === "fr") return fr_sidebar_lensopenallfeed3(inputs)
	if (locale === "de") return de_sidebar_lensopenallfeed3(inputs)
	if (locale === "ja") return ja_sidebar_lensopenallfeed3(inputs)
	if (locale === "ko") return ko_sidebar_lensopenallfeed3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensopenallfeed3(inputs)
	return ru_sidebar_lensopenallfeed3(inputs)
});
export { sidebar_lensopenallfeed3 as "sidebar_lensOpenAllFeed" }