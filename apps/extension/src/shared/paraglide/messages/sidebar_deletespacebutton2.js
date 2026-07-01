/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Deletespacebutton2Inputs */

const en_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Space…`)
};

const es_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar espacio…`)
};

const pt_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Espaço…`)
};

const fr_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer l'espace…`)
};

const de_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Raum löschen…`)
};

const ja_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`スペースを削除…`)
};

const ko_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`스페이스 삭제…`)
};

const zh_cn2_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`删除空间…`)
};

const ru_sidebar_deletespacebutton2 = /** @type {(inputs: Sidebar_Deletespacebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Удалить пространство…`)
};

/**
* | output |
* | --- |
* | "Delete Space…" |
*
* @param {Sidebar_Deletespacebutton2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_deletespacebutton2 = /** @type {((inputs?: Sidebar_Deletespacebutton2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Deletespacebutton2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_deletespacebutton2(inputs)
	if (locale === "es") return es_sidebar_deletespacebutton2(inputs)
	if (locale === "pt") return pt_sidebar_deletespacebutton2(inputs)
	if (locale === "fr") return fr_sidebar_deletespacebutton2(inputs)
	if (locale === "de") return de_sidebar_deletespacebutton2(inputs)
	if (locale === "ja") return ja_sidebar_deletespacebutton2(inputs)
	if (locale === "ko") return ko_sidebar_deletespacebutton2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_deletespacebutton2(inputs)
	return ru_sidebar_deletespacebutton2(inputs)
});
export { sidebar_deletespacebutton2 as "sidebar_deleteSpaceButton" }