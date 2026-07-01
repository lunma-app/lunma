/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Copylink1Inputs */

const en_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy link`)
};

const es_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar enlace`)
};

const pt_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar ligação`)
};

const fr_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le lien`)
};

const de_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link kopieren`)
};

const ja_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`リンクをコピー`)
};

const ko_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`링크 복사`)
};

const zh_cn2_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`复制链接`)
};

const ru_sidebar_copylink1 = /** @type {(inputs: Sidebar_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Копировать ссылку`)
};

/**
* | output |
* | --- |
* | "Copy link" |
*
* @param {Sidebar_Copylink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_copylink1 = /** @type {((inputs?: Sidebar_Copylink1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Copylink1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_copylink1(inputs)
	if (locale === "es") return es_sidebar_copylink1(inputs)
	if (locale === "pt") return pt_sidebar_copylink1(inputs)
	if (locale === "fr") return fr_sidebar_copylink1(inputs)
	if (locale === "de") return de_sidebar_copylink1(inputs)
	if (locale === "ja") return ja_sidebar_copylink1(inputs)
	if (locale === "ko") return ko_sidebar_copylink1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_copylink1(inputs)
	return ru_sidebar_copylink1(inputs)
});
export { sidebar_copylink1 as "sidebar_copyLink" }