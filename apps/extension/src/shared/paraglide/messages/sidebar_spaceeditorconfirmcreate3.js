/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spaceeditorconfirmcreate3Inputs */

const en_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Space`)
};

const es_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear espacio`)
};

const pt_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criar Espaço`)
};

const fr_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer l'espace`)
};

const de_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Raum erstellen`)
};

const ja_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`スペースを作成`)
};

const ko_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`스페이스 만들기`)
};

const zh_cn2_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`创建空间`)
};

const ru_sidebar_spaceeditorconfirmcreate3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmcreate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Создать пространство`)
};

/**
* | output |
* | --- |
* | "Create Space" |
*
* @param {Sidebar_Spaceeditorconfirmcreate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditorconfirmcreate3 = /** @type {((inputs?: Sidebar_Spaceeditorconfirmcreate3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditorconfirmcreate3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "es") return es_sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "pt") return pt_sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "fr") return fr_sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "de") return de_sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "ja") return ja_sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "ko") return ko_sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spaceeditorconfirmcreate3(inputs)
	return ru_sidebar_spaceeditorconfirmcreate3(inputs)
});
export { sidebar_spaceeditorconfirmcreate3 as "sidebar_spaceEditorConfirmCreate" }