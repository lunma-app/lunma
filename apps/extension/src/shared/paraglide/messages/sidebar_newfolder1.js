/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Newfolder1Inputs */

const en_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New folder`)
};

const es_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva carpeta`)
};

const pt_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nova pasta`)
};

const fr_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau dossier`)
};

const de_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neuer Ordner`)
};

const ja_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新しいフォルダ`)
};

const ko_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 폴더`)
};

const zh_cn2_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新建文件夹`)
};

const ru_sidebar_newfolder1 = /** @type {(inputs: Sidebar_Newfolder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Новая папка`)
};

/**
* | output |
* | --- |
* | "New folder" |
*
* @param {Sidebar_Newfolder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_newfolder1 = /** @type {((inputs?: Sidebar_Newfolder1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Newfolder1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_newfolder1(inputs)
	if (locale === "es") return es_sidebar_newfolder1(inputs)
	if (locale === "pt") return pt_sidebar_newfolder1(inputs)
	if (locale === "fr") return fr_sidebar_newfolder1(inputs)
	if (locale === "de") return de_sidebar_newfolder1(inputs)
	if (locale === "ja") return ja_sidebar_newfolder1(inputs)
	if (locale === "ko") return ko_sidebar_newfolder1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_newfolder1(inputs)
	return ru_sidebar_newfolder1(inputs)
});
export { sidebar_newfolder1 as "sidebar_newFolder" }