/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Archiveafterlabel2Inputs */

const en_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archive after`)
};

const es_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivar tras`)
};

const pt_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arquivar após`)
};

const fr_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archiver après`)
};

const de_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivieren nach`)
};

const ja_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アーカイブするまで`)
};

const ko_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보관 기준 시간`)
};

const zh_cn2_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`归档时限`)
};

const ru_sidebar_archiveafterlabel2 = /** @type {(inputs: Sidebar_Archiveafterlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Архивировать через`)
};

/**
* | output |
* | --- |
* | "Archive after" |
*
* @param {Sidebar_Archiveafterlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_archiveafterlabel2 = /** @type {((inputs?: Sidebar_Archiveafterlabel2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Archiveafterlabel2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_archiveafterlabel2(inputs)
	if (locale === "es") return es_sidebar_archiveafterlabel2(inputs)
	if (locale === "pt") return pt_sidebar_archiveafterlabel2(inputs)
	if (locale === "fr") return fr_sidebar_archiveafterlabel2(inputs)
	if (locale === "de") return de_sidebar_archiveafterlabel2(inputs)
	if (locale === "ja") return ja_sidebar_archiveafterlabel2(inputs)
	if (locale === "ko") return ko_sidebar_archiveafterlabel2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_archiveafterlabel2(inputs)
	return ru_sidebar_archiveafterlabel2(inputs)
});
export { sidebar_archiveafterlabel2 as "sidebar_archiveAfterLabel" }