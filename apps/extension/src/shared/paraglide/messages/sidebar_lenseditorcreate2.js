/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lenseditorcreate2Inputs */

const en_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create lens`)
};

const es_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear lente`)
};

const pt_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criar lens`)
};

const fr_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une vue`)
};

const de_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lens erstellen`)
};

const ja_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`レンズを作成`)
};

const ko_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`렌즈 만들기`)
};

const zh_cn2_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新建镜头`)
};

const ru_sidebar_lenseditorcreate2 = /** @type {(inputs: Sidebar_Lenseditorcreate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Создать линзу`)
};

/**
* | output |
* | --- |
* | "Create lens" |
*
* @param {Sidebar_Lenseditorcreate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenseditorcreate2 = /** @type {((inputs?: Sidebar_Lenseditorcreate2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenseditorcreate2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenseditorcreate2(inputs)
	if (locale === "es") return es_sidebar_lenseditorcreate2(inputs)
	if (locale === "pt") return pt_sidebar_lenseditorcreate2(inputs)
	if (locale === "fr") return fr_sidebar_lenseditorcreate2(inputs)
	if (locale === "de") return de_sidebar_lenseditorcreate2(inputs)
	if (locale === "ja") return ja_sidebar_lenseditorcreate2(inputs)
	if (locale === "ko") return ko_sidebar_lenseditorcreate2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenseditorcreate2(inputs)
	return ru_sidebar_lenseditorcreate2(inputs)
});
export { sidebar_lenseditorcreate2 as "sidebar_lensEditorCreate" }