/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spaceautoarchive2Inputs */

const en_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-archive`)
};

const es_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo automático`)
};

const pt_pt2_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arquivo automático`)
};

const fr_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivage auto`)
};

const de_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatisch archivieren`)
};

const ja_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自動アーカイブ`)
};

const ko_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자동 보관`)
};

const zh_cn2_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自动归档`)
};

const ru_sidebar_spaceautoarchive2 = /** @type {(inputs: Sidebar_Spaceautoarchive2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Авто-архивирование`)
};

/**
* | output |
* | --- |
* | "Auto-archive" |
*
* @param {Sidebar_Spaceautoarchive2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceautoarchive2 = /** @type {((inputs?: Sidebar_Spaceautoarchive2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceautoarchive2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spaceautoarchive2(inputs)
	if (locale === "es") return es_sidebar_spaceautoarchive2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_spaceautoarchive2(inputs)
	if (locale === "fr") return fr_sidebar_spaceautoarchive2(inputs)
	if (locale === "de") return de_sidebar_spaceautoarchive2(inputs)
	if (locale === "ja") return ja_sidebar_spaceautoarchive2(inputs)
	if (locale === "ko") return ko_sidebar_spaceautoarchive2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spaceautoarchive2(inputs)
	return ru_sidebar_spaceautoarchive2(inputs)
});
export { sidebar_spaceautoarchive2 as "sidebar_spaceAutoArchive" }