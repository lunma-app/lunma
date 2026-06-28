/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Idleminutesaria2Inputs */

const en_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Idle minutes before archiving`)
};

const es_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minutos inactivo antes de archivar`)
};

const pt_pt2_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minutos de inatividade antes de arquivar`)
};

const fr_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minutes d'inactivité avant archivage`)
};

const de_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inaktive Minuten vor dem Archivieren`)
};

const ja_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アーカイブまでのアイドル時間（分）`)
};

const ko_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보관 전 유휴 시간(분)`)
};

const zh_cn2_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`归档前的闲置分钟数`)
};

const ru_sidebar_idleminutesaria2 = /** @type {(inputs: Sidebar_Idleminutesaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Минут простоя до архивирования`)
};

/**
* | output |
* | --- |
* | "Idle minutes before archiving" |
*
* @param {Sidebar_Idleminutesaria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_idleminutesaria2 = /** @type {((inputs?: Sidebar_Idleminutesaria2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Idleminutesaria2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_idleminutesaria2(inputs)
	if (locale === "es") return es_sidebar_idleminutesaria2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_idleminutesaria2(inputs)
	if (locale === "fr") return fr_sidebar_idleminutesaria2(inputs)
	if (locale === "de") return de_sidebar_idleminutesaria2(inputs)
	if (locale === "ja") return ja_sidebar_idleminutesaria2(inputs)
	if (locale === "ko") return ko_sidebar_idleminutesaria2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_idleminutesaria2(inputs)
	return ru_sidebar_idleminutesaria2(inputs)
});
export { sidebar_idleminutesaria2 as "sidebar_idleMinutesAria" }