/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Recentlyarchivedheading2Inputs */

const en_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recently archived`)
};

const es_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivado recientemente`)
};

const pt_pt2_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arquivado recentemente`)
};

const fr_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récemment archivé`)
};

const de_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kürzlich archiviert`)
};

const ja_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`最近アーカイブ`)
};

const ko_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`최근 보관됨`)
};

const zh_cn2_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`最近已归档`)
};

const ru_options_recentlyarchivedheading2 = /** @type {(inputs: Options_Recentlyarchivedheading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Недавно архивировано`)
};

/**
* | output |
* | --- |
* | "Recently archived" |
*
* @param {Options_Recentlyarchivedheading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_recentlyarchivedheading2 = /** @type {((inputs?: Options_Recentlyarchivedheading2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Recentlyarchivedheading2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_recentlyarchivedheading2(inputs)
	if (locale === "es") return es_options_recentlyarchivedheading2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_recentlyarchivedheading2(inputs)
	if (locale === "fr") return fr_options_recentlyarchivedheading2(inputs)
	if (locale === "de") return de_options_recentlyarchivedheading2(inputs)
	if (locale === "ja") return ja_options_recentlyarchivedheading2(inputs)
	if (locale === "ko") return ko_options_recentlyarchivedheading2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_recentlyarchivedheading2(inputs)
	return ru_options_recentlyarchivedheading2(inputs)
});
export { options_recentlyarchivedheading2 as "options_recentlyArchivedHeading" }