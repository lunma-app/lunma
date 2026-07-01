/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensmissingcopy2Inputs */

const en_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This page didn't get a lens to open, or that lens is no longer around.`)
};

const es_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta página no tiene una lente asignada, o esa lente ya no existe.`)
};

const pt_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta página não tem lens para abrir, ou essa lens já não existe.`)
};

const fr_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette page n'a pas de vue à ouvrir, ou cette vue n'existe plus.`)
};

const de_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diese Seite hat keine Lens erhalten, oder sie existiert nicht mehr.`)
};

const ja_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このページはレンズを受け取っていないか、そのレンズはもう存在しません。`)
};

const ko_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 페이지에 열 렌즈가 없거나, 해당 렌즈가 더 이상 존재하지 않습니다.`)
};

const zh_cn2_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`此页面未关联镜头，或该镜头已不存在`)
};

const ru_launcher_lensmissingcopy2 = /** @type {(inputs: Launcher_Lensmissingcopy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Для этой страницы не назначена линза, или она больше недоступна.`)
};

/**
* | output |
* | --- |
* | "This page didn't get a lens to open, or that lens is no longer around." |
*
* @param {Launcher_Lensmissingcopy2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensmissingcopy2 = /** @type {((inputs?: Launcher_Lensmissingcopy2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensmissingcopy2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensmissingcopy2(inputs)
	if (locale === "es") return es_launcher_lensmissingcopy2(inputs)
	if (locale === "pt") return pt_launcher_lensmissingcopy2(inputs)
	if (locale === "fr") return fr_launcher_lensmissingcopy2(inputs)
	if (locale === "de") return de_launcher_lensmissingcopy2(inputs)
	if (locale === "ja") return ja_launcher_lensmissingcopy2(inputs)
	if (locale === "ko") return ko_launcher_lensmissingcopy2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensmissingcopy2(inputs)
	return ru_launcher_lensmissingcopy2(inputs)
});
export { launcher_lensmissingcopy2 as "launcher_lensMissingCopy" }